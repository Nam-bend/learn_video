from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Video
import uuid

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
    return {"id": str(video.id), "title": video.title, "status": video.status,"transcript": video.transcript }

@router.get("/videos")
async def list_videos(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).order_by(Video.created_at.desc()))
    videos = result.scalars().all()
    return [
        {"id": str(v.id), "title": v.title, "status": v.status, "source_type": v.source_type, "transcript": v.transcript}
        for v in videos
    ]