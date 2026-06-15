from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Video, ChatMessage, VideoChunk
from app.config import settings
from app.utils.ai import get_embedding
from openai import AsyncOpenAI
import uuid
import numpy as np
from rank_bm25 import BM25Okapi

# Từ khoá để nhận diện yêu cầu "toàn bộ nội dung"
FULL_CONTENT_KEYWORDS = [
    "toàn bộ", "tất cả", "dịch hết", "toàn văn", "nội dung đầy đủ",
    "từ chương", "toàn bộ nội dung", "dịch toàn", "đọc toàn",
    "tất cả nội dung", "chi tiết nhất", "đầy đủ nhất",
    "translate all", "full content", "full translation", "entire"
]

# Từ khoá để nhận diện yêu cầu "tổng quan / khái niệm" (cần ngữ cảnh rộng thay vì tìm kiếm vector cục bộ)
BROAD_CONTEXT_KEYWORDS = [
    "tóm tắt", "khái niệm", "ý chính", "tổng quan", "cơ bản", 
    "giải thích", "nội dung chính", "tổng hợp", "summary", "overview",
    "sơ đồ", "tư duy", "quan trọng", "cần nhớ", "mindmap"
]

def is_full_content_request(text: str) -> bool:
    """Kiểm tra xem câu hỏi có phải là yêu cầu dịch/hiển thị toàn bộ nội dung không."""
    text_lower = text.lower()
    return any(kw in text_lower for kw in FULL_CONTENT_KEYWORDS)

def is_broad_context_request(text: str) -> bool:
    """Kiểm tra xem câu hỏi có mang tính chất tổng quan không."""
    text_lower = text.lower()
    return any(kw in text_lower for kw in BROAD_CONTEXT_KEYWORDS)

router = APIRouter()

client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL
)

@router.post("/chat/{video_id}")
async def chat(video_id: str, payload: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
    video = result.scalar_one_or_none()
    
    if not video or video.status not in ("done", "completed"):
        raise HTTPException(400, "Video chưa được dịch xong hoặc không tồn tại")

    question = payload.get("message", "")
    if not question:
        raise HTTPException(400, "Tin nhắn không được để trống")

    # 1. Lấy lịch sử hội thoại gần nhất (tối đa 10 tin nhắn gần nhất) để làm ngữ cảnh
    result_history = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.video_id == video.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(10)
    )
    history_messages = list(result_history.scalars().all())
    history_messages.reverse()

    # --- RAG RETRIEVAL (PYTHON-SIDE / VECTORIZED NUMPY) ---
    full_content_mode = (
        is_full_content_request(question)
        and video.media_type in ("pdf", "docx")
    )
    broad_context_mode = is_broad_context_request(question)

    try:
        if full_content_mode:
            # Chế độ toàn bộ: lấy TẤT CẢ chunk theo thứ tự trang (tối đa 40 chunk ~ 8000 từ)
            result_chunks = await db.execute(
                select(VideoChunk)
                .where(VideoChunk.video_id == video.id)
                .order_by(VideoChunk.start_time)
                .limit(40)
            )
            top_chunks = list(result_chunks.scalars().all())
            print(f"[Full-Content Mode] Lấy {len(top_chunks)} chunk theo thứ tự trang.")
        elif broad_context_mode:
            # Chế độ tổng quan: lấy dàn trải đều các chunk từ đầu đến cuối tài liệu
            result_chunks = await db.execute(
                select(VideoChunk).where(VideoChunk.video_id == video.id).order_by(VideoChunk.start_time)
            )
            all_chunks = list(result_chunks.scalars().all())
            if all_chunks:
                # Lấy 15 chunk dàn trải đều
                step = max(1, len(all_chunks) // 15)
                top_chunks = all_chunks[::step][:15]
                print(f"[Broad-Context Mode] Sampled {len(top_chunks)} chunks evenly.")
            else:
                top_chunks = []
                formatted_context = "Không tìm thấy dữ liệu bổ trợ."
        else:
            # Chế độ RAG thông thường: lấy top-8 chunk liên quan nhất bằng Cosine Similarity
            question_vector = await get_embedding(question)

            result_chunks = await db.execute(
                select(VideoChunk).where(VideoChunk.video_id == video.id)
            )
            all_chunks = list(result_chunks.scalars().all())

            if all_chunks:
                q_v = np.array(question_vector)
                embeddings = np.array([c.embedding for c in all_chunks])

                q_norm = np.linalg.norm(q_v)
                c_norms = np.linalg.norm(embeddings, axis=1)
                dot_products = np.dot(embeddings, q_v)
                similarities = dot_products / (q_norm * c_norms + 1e-9)

                # --- BM25 Keyword Search ---
                tokenized_corpus = [c.content.lower().split() for c in all_chunks]
                bm25 = BM25Okapi(tokenized_corpus)
                tokenized_query = question.lower().split()
                bm25_scores = np.array(bm25.get_scores(tokenized_query))

                # --- Hybrid Search (RRF - Reciprocal Rank Fusion) ---
                # Tính rank của từng chunk cho cả 2 thuật toán
                rank_vector = np.argsort(similarities)[::-1]
                rank_bm25 = np.argsort(bm25_scores)[::-1]
                
                rrf_scores = np.zeros(len(all_chunks))
                for rank, idx in enumerate(rank_vector):
                    rrf_scores[idx] += 1.0 / (60 + rank + 1)
                for rank, idx in enumerate(rank_bm25):
                    rrf_scores[idx] += 1.0 / (60 + rank + 1)

                # Xác định Top-K dựa trên loại câu hỏi
                COMPARISON_KEYWORDS = ["so sánh", "cái nào", "hơn", "kém", "tất cả", "liệt kê", "những", "các"]
                if any(kw in question.lower() for kw in COMPARISON_KEYWORDS):
                    top_k = 20
                else:
                    top_k = 8

                SIMILARITY_THRESHOLD = 0.40
                
                # Lấy top_k chunk dựa trên điểm RRF (Hybrid)
                top_indices_raw = np.argsort(rrf_scores)[::-1][:top_k]
                
                # Lọc bỏ những chunk không khớp để chống ảo giác (Phải có ít nhất điểm Vector tốt hoặc điểm Keyword > 0)
                top_indices = [idx for idx in top_indices_raw if similarities[idx] >= SIMILARITY_THRESHOLD or bm25_scores[idx] > 0]
                
                # In log phân tích RAG trực tiếp ra terminal Backend
                print(f"\n[{'='*60}]")
                print(f"🔍 RAG QUERY LOG: '{question}'")
                print(f"[{'='*60}]")
                print(f"{'Rank':<5} | {'Hybrid RRF':<10} | {'Cosine':<7} | {'BM25':<7} | {'Location':<10} | {'Content'}")
                print("-" * 85)
                
                for rank, idx in enumerate(top_indices, 1):
                    chunk = all_chunks[idx]
                    rrf_s = rrf_scores[idx]
                    cos_s = similarities[idx]
                    bm_s = bm25_scores[idx]
                    pos = f"Pg {int(chunk.start_time)}" if video.media_type != "video" else f"T {int(chunk.start_time//60)}:{int(chunk.start_time%60):02d}"
                    snippet = chunk.content[:40].replace('\n', ' ') + "..."
                    print(f"{rank:<5} | {rrf_s:.4f}     | {cos_s:.4f}  | {bm_s:.4f}  | {pos:<10} | {snippet}")
                
                top8_words = sum(len(all_chunks[idx].content.split()) for idx in top_indices_raw[:8])
                print("-" * 85)
                print(f"Context Tokens Estimate (Top 8): ~{int(top8_words*1.3)} tokens")
                print(f"[{'='*60}]\n")
                
                top_chunks = [all_chunks[idx] for idx in top_indices]
                top_chunks.sort(key=lambda x: x.start_time)
            else:
                top_chunks = []
                formatted_context = "Không tìm thấy dữ liệu bổ trợ."

    except Exception as e:
        print(f"🔥 RAG Retrieval Error: {e}")
        top_chunks = []
        formatted_context = "Lỗi khi truy xuất dữ liệu."

    # Chọn hướng dẫn trích dẫn dựa trên loại media
    if video.media_type == "video":
        media_name = "video"
        citation_format = "định dạng [MM:SS]"
        context_label = "Các đoạn trích dẫn từ video"
        if top_chunks:
            formatted_context = "\n".join(
                f"[{int(c.start_time//60):02d}:{int(c.start_time%60):02d}] {c.content}" 
                for c in top_chunks
            )
    else:
        media_name = "tài liệu"
        citation_format = "định dạng [Trang X]"
        context_label = "Các đoạn trích dẫn từ tài liệu"
        if top_chunks:
            formatted_context = "\n".join(
                f"[Trang {int(c.start_time)}] {c.content}" 
                for c in top_chunks
            )

    # Xây dựng danh sách tin nhắn gửi lên LLM bao gồm cả lịch sử trò chuyện
    if full_content_mode:
        system_content = (
            f"Bạn là một trợ lý dịch thuật và học tập chuyên nghiệp.\n"
            f"Người dùng muốn bạn dịch và trình bày TOÀN BỘ nội dung {media_name} được cung cấp sang tiếng Việt.\n"
            f"Yêu cầu QUAN TRỌNG:\n"
            f"1. Dịch ĐẦY ĐỦ, CHI TIẾT từng đoạn theo đúng thứ tự - KHÔNG được tóm tắt, lược bỏ hay bỏ qua bất kỳ thông tin nào.\n"
            f"2. Giữ nguyên cấu trúc gốc: tiêu đề, đoạn văn, danh sách, bảng biểu.\n"
            f"3. Đính kèm trích dẫn {citation_format} ở đầu mỗi phần.\n"
            f"4. Dịch tự nhiên, chuẩn mực tiếng Việt học thuật."
        )
    else:
        system_content = (
            f"Bạn là một trợ lý học tập. Đối với các câu hỏi liên quan đến nội dung bài học, hãy CHỈ dựa vào những đoạn trích dẫn từ {media_name} được cung cấp để trả lời.\n"
            f"TUYỆT ĐỐI KHÔNG tự bịa ra thông tin (hallucinate). Nếu ngữ cảnh không có thông tin để trả lời, hãy nói rõ: 'Tôi không tìm thấy thông tin này trong tài liệu'.\n"
            f"Hãy trả lời chi tiết, súc tích và QUAN TRỌNG NHẤT: Bắt buộc đính kèm dẫn chứng cụ thể bằng {citation_format} vào những thông tin quan trọng.\n"
            f"LƯU Ý 1: Chỉ trích dẫn 1 nguồn gốc hợp lý nhất cho mỗi thông tin, tránh liệt kê hàng loạt trang trùng lặp cho cùng một ý.\n"
            f"LƯU Ý 2: Nếu người dùng yêu cầu tạo 'sơ đồ tư duy' hoặc 'mindmap', TUYỆT ĐỐI KHÔNG dùng code block mermaid. Hãy vẽ sơ đồ trực quan bằng văn bản thuần.\n"
            f"LƯU Ý 3: Nếu người dùng chỉ xã giao (chào hỏi, cảm ơn...), hãy phản hồi ngắn gọn, lịch sự mà không cần trích dẫn."
        )

    messages = [{"role": "system", "content": system_content}]

    # Bổ sung các tin nhắn lịch sử
    for msg in history_messages:
        messages.append({"role": msg.role, "content": msg.content})

    # Tin nhắn cuối cùng chứa câu hỏi và ngữ cảnh trích xuất
    if not top_chunks and not full_content_mode and not broad_context_mode:
        user_content = f"Không có ngữ cảnh nào phù hợp trong tài liệu.\n\nCâu hỏi: {question}"
    else:
        user_content = (
            f"{context_label}:\n{formatted_context}\n\n"
            f"Câu hỏi: {question}"
        )
    messages.append({"role": "user", "content": user_content})

    async def stream_generator():
        full_answer = ""
        try:
            response = await client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                stream=True
            )
            
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_answer += content
                    yield content

            # Sau khi kết thúc stream, lưu vào DB
            if full_answer:
                # Tạo session mới để lưu DB vì session chính có thể đã đóng
                from app.database import AsyncSessionLocal
                async with AsyncSessionLocal() as new_db:
                    new_db.add(ChatMessage(video_id=video.id, role="user", content=question))
                    new_db.add(ChatMessage(video_id=video.id, role="assistant", content=full_answer))
                    await new_db.commit()
        except Exception as e:
            print(f" Stream Error: {e}")
            yield f"\n[Lỗi AI: {str(e)}]"

    return StreamingResponse(stream_generator(), media_type="text/plain")

@router.get("/chat/{video_id}")
async def get_chat_history(video_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.video_id == uuid.UUID(video_id))
        .order_by(ChatMessage.created_at.asc())
    )
    messages = result.scalars().all()
    return [
        {"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()}
        for m in messages
    ]