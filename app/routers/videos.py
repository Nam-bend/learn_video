from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Video
import uuid, os
from pathlib import Path
from app.config import settings

router = APIRouter()

@router.post("/video-info")
async def create_video_info(payload: dict, db: AsyncSession = Depends(get_db)):
    video = Video(
        source_type=payload.get("source_type", "local"),
        source_ref=payload.get("source_ref"),
        title=payload.get("title"),
        status="pending"
    )
    db.add(video)
    await db.commit()
    await db.refresh(video)
    return {"id": str(video.id), "status": video.status}

@router.get("/video-info/{video_id}")
async def get_video_info(video_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(404, "Không tìm thấy video")
    return {
        "id": str(video.id), 
        "title": video.title, 
        "status": video.status,
        "source_type": video.source_type,
        "source_ref": video.source_ref,
        "transcript": video.transcript 
    }

@router.get("/videos")
async def list_videos(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).order_by(Video.created_at.desc()))
    videos = result.scalars().all()
    return [
        {"id": str(v.id), "title": v.title, "status": v.status, "source_type": v.source_type, "transcript": v.transcript}
        for v in videos
    ]

@router.patch("/video-info/{video_id}")
async def update_video_info(video_id: str, payload: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(404, "Không tìm thấy video")
    
    if "title" in payload:
        video.title = payload["title"]
        
    await db.commit()
    return {"status": "success"}

@router.delete("/video-info/{video_id}")
async def delete_video(video_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(404, "Không tìm thấy video")
        
    # XÓA FILE TRÊN ĐĨA
    if video.source_type == "local" and video.source_ref:
        file_path = Path(settings.UPLOAD_DIR) / video.source_ref
        try:
            if file_path.exists():
                os.remove(file_path)
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")

    await db.delete(video)
    await db.commit()
    return {"status": "success"}