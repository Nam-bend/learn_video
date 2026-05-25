from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db, AsyncSessionLocal
from app.models import Video, VideoChunk
from app.config import settings
from app.utils.extractors import extract_text_from_pdf, extract_text_from_docx
from app.utils.ai import get_embedding
from faster_whisper import WhisperModel
import uuid
from pathlib import Path
import asyncio
from concurrent.futures import ThreadPoolExecutor

router = APIRouter()

#  Load model 1 lần duy nhất
model = WhisperModel(
    "tiny",
    compute_type="int8",
    cpu_threads=2
)

# Executor để chạy tác vụ nặng (Whisper) trong luồng riêng
executor = ThreadPoolExecutor(max_workers=1)

def run_whisper(file_path: str):
    """Hàm chạy Whisper đồng bộ trong threadpool"""
    segments, _ = model.transcribe(file_path)
    result_data = []
    for seg in segments:
        result_data.append({
            "start": seg.start,
            "end": seg.end,
            "text": seg.text.strip()
        })
    return result_data

async def process_transcription_task(video_id: uuid.UUID):
    """Tác vụ ngầm xử lý dịch video"""
    async with AsyncSessionLocal() as db:
        # Lấy video info
        result = await db.execute(select(Video).where(Video.id == video_id))
        video = result.scalar_one_or_none()
        if not video:
            return

        # Tìm file
        upload_dir = Path(settings.UPLOAD_DIR)
        file_path = upload_dir / video.source_ref
        
        if file_path.exists():
            target_file = file_path
        else:
            matches = list(upload_dir.glob(f"{video.source_ref}.*"))
            if not matches:
                video.status = "error"
                video.error_message = "File video đã bị xóa hoặc không tìm thấy"
                await db.commit()
                return
            target_file = matches[0]

        try:
            if video.media_type == "video":
                # Chạy whisper trong threadpool để không block event loop
                loop = asyncio.get_event_loop()
                result_data = await loop.run_in_executor(executor, run_whisper, str(target_file))
                
                # Chuyển đổi định dạng whisper sang chuẩn chung
                # (Whisper đã trả về format: [{"start": 0.0, "end": 2.0, "text": "..."}])
                formatted_data = result_data
            elif video.media_type in ("pdf", "docx"):
                if video.media_type == "pdf":
                    result_data = extract_text_from_pdf(str(target_file))
                else:
                    result_data = extract_text_from_docx(str(target_file))
                
                formatted_data = [{"start": item["page"], "text": item["text"]} for item in result_data]
            else:
                raise Exception(f"Không hỗ trợ xử lý cho loại {video.media_type}")

            # Cập nhật kết quả transcript và lưu vào DB ngay lập tức để UI hiển thị trước
            video.transcript = formatted_data
            video.status = "done"
            await db.commit()

            # --- RAG INDEXING ---
            chunks_to_index = []
            
            if video.media_type == "video":
                # Thuật toán chunking cho Video: gom theo từ (~180 từ), gối đầu (overlap) 1 segment
                target_words = 180
                overlap_segments_count = 1
                
                i = 0
                n = len(formatted_data)
                while i < n:
                    current_chunk_segs = []
                    word_count = 0
                    
                    # Thêm các segments vào chunk cho đến khi đủ số từ
                    j = i
                    while j < n:
                        seg = formatted_data[j]
                        current_chunk_segs.append(seg)
                        words_in_seg = len(seg['text'].split())
                        word_count += words_in_seg
                        
                        # Dừng nếu đã vượt quá target_words
                        if word_count >= target_words:
                            break
                        j += 1
                    
                    if current_chunk_segs:
                        chunk_text = " ".join(s['text'] for s in current_chunk_segs).strip()
                        start_ref = current_chunk_segs[0]['start']
                        chunks_to_index.append((chunk_text, start_ref))
                        
                    # Tính bước nhảy tiếp theo (lùi lại overlap_segments_count để tạo overlap)
                    next_i = j + 1 - overlap_segments_count
                    if next_i <= i:
                        next_i = i + 1
                    i = next_i
            else:
                # Đối với tài liệu (PDF/DOCX): Chia nhỏ trang tài liệu thành các đoạn con ~200 từ, overlap 50 từ.
                target_words = 200
                overlap_words = 50
                
                for item in formatted_data:
                    page_num = item['start'] # Page number được map sang 'start' ở trên
                    text = item['text']
                    words = text.split()
                    
                    if len(words) <= target_words:
                        chunks_to_index.append((text, page_num))
                    else:
                        w_idx = 0
                        total_w = len(words)
                        while w_idx < total_w:
                            sub_words = words[w_idx : w_idx + target_words]
                            sub_text = " ".join(sub_words).strip()
                            if sub_text:
                                chunks_to_index.append((sub_text, page_num))
                            w_idx += (target_words - overlap_words)
            
            # Tạo embedding và lưu vào cơ sở dữ liệu
            for chunk_text, start_ref in chunks_to_index:
                vector = await get_embedding(chunk_text)
                new_chunk = VideoChunk(
                    video_id=video_id,
                    content=chunk_text,
                    start_time=start_ref,
                    embedding=vector
                )
                db.add(new_chunk)

            # --- TRANSLATE TO VIETNAMESE (SIMULTANEOUS BACKGROUND TASK) ---
            try:
                from app.utils.ai import translate_transcript_list
                from sqlalchemy.orm.attributes import flag_modified
                
                # Dịch đồng thời sang tiếng Việt ngay khi có transcript
                translated_list = await translate_transcript_list(formatted_data, model_name="gpt-4o-mini")
                
                video.content_cache = {**(video.content_cache or {}), "translated_transcript": translated_list}
                flag_modified(video, "content_cache")
            except Exception as translate_err:
                print(f"🔥 Auto-translation failed in background: {translate_err}")
            
        except Exception as e:
            print(f"🔥 Processing/RAG Error: {e}")
            video.status = "error"
            video.error_message = str(e)
        
        await db.commit()

@router.post("/transcript/{video_id}")
async def transcribe(video_id: str, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    v_id = uuid.UUID(video_id)
    result = await db.execute(select(Video).where(Video.id == v_id))
    video = result.scalar_one_or_none()

    if not video:
        raise HTTPException(404, "Không tìm thấy video")

    if video.status == "transcribing":
        return {"status": "already_processing", "message": "Video đang được dịch rồi"}

    # Cập nhật trạng thái sang 'transcribing' ngay lập tức
    video.status = "transcribing"
    await db.commit()

    # Thêm tác vụ chạy ngầm
    background_tasks.add_task(process_transcription_task, v_id)

    return {
        "status": "processing",
        "message": "Bắt đầu quá trình dịch ngầm. Bạn có thể tiếp tục sử dụng ứng dụng."
    }