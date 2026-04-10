from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db, AsyncSessionLocal
from app.models import Video
from app.config import settings
from faster_whisper import WhisperModel
import uuid
from pathlib import Path
import asyncio
from concurrent.futures import ThreadPoolExecutor

router = APIRouter()

# 🔥 Load model 1 lần duy nhất
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
        matches = list(upload_dir.glob(f"{video.source_ref}.*"))
        if not matches:
            video.status = "error"
            video.error_message = "File video đã bị xóa hoặc không tìm thấy"
            await db.commit()
            return

        try:
            # Chạy whisper trong threadpool để không block event loop
            loop = asyncio.get_event_loop()
            result_data = await loop.run_in_executor(executor, run_whisper, str(matches[0]))

            # Cập nhật kết quả
            video.transcript = result_data
            video.status = "done"
        except Exception as e:
            print(f"🔥 Transcription Error: {e}")
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