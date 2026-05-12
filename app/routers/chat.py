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
import json

router = APIRouter()

client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL
)

@router.post("/chat/{video_id}")
async def chat(video_id: str, payload: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
    video = result.scalar_one_or_none()
    
    if not video or video.status != "done":
        raise HTTPException(400, "Video chưa được dịch xong hoặc không tồn tại")

    question = payload.get("message", "")
    if not question:
        raise HTTPException(400, "Tin nhắn không được để trống")

    # --- RAG RETRIEVAL (PYTHON-SIDE) ---
    try:
        # 1. Chuyển câu hỏi thành vector
        question_vector = await get_embedding(question)

        # 2. Lấy tất cả các chunk của video này từ DB
        result_chunks = await db.execute(
            select(VideoChunk).where(VideoChunk.video_id == video.id)
        )
        all_chunks = result_chunks.scalars().all()

        if all_chunks:
            # 3. Tính toán độ tương đồng Cosine bằng Numpy
            q_v = np.array(question_vector)
            
            def get_sim(chunk):
                c_v = np.array(chunk.embedding)
                return np.dot(q_v, c_v) / (np.linalg.norm(q_v) * np.linalg.norm(c_v))

            # Sắp xếp các chunk theo độ tương đồng giảm dần
            all_chunks.sort(key=get_sim, reverse=True)
            
            # Lấy top 5 đoạn liên quan nhất
            top_chunks = all_chunks[:5]

            # Sắp xếp lại theo thời gian để AI dễ đọc hơn
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

    # Gộp system prompt vào user message để hỗ trợ streaming ổn định
    full_prompt = (
        f"Bạn là một trợ lý học tập. Hãy dựa vào những đoạn trích dẫn từ {media_name} được cung cấp để trả lời câu hỏi của người dùng. "
        f"Hãy trả lời chi tiết, súc tích và QUAN TRỌNG NHẤT: Bắt buộc đính kèm dẫn chứng cụ thể bằng {citation_format} vào những thông tin quan trọng.\n\n"
        f"{context_label}:\n{formatted_context}\n\n"
        f"Câu hỏi: {question}"
    )

    async def stream_generator():
        full_answer = ""
        try:
            response = await client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[{"role": "user", "content": full_prompt}],
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
                from app.database import SessionLocal
                async with SessionLocal() as new_db:
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