from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db
from app.models import Video
import uuid
from pydantic import BaseModel

router = APIRouter()

CACHE_KEY = "user_notes"

class NoteUpdate(BaseModel):
    content: str

@router.get("/notes/{video_id}")
async def get_notes(video_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(404, "Không tìm thấy video")

    cache = video.content_cache or {}
    notes = cache.get(CACHE_KEY, "")
    
    return {"notes": notes}

@router.post("/notes/{video_id}")
async def save_notes(video_id: str, payload: NoteUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(404, "Không tìm thấy video")

    cache = video.content_cache or {}
    new_cache = {**cache, CACHE_KEY: payload.content}
    
    await db.execute(update(Video).where(Video.id == video.id).values(content_cache=new_cache))
    await db.commit()
    
    return {"status": "success"}
