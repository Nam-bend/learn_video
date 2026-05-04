from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db
from app.models import Video
from app.config import settings
from openai import AsyncOpenAI
import uuid, json

router = APIRouter()
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)

CACHE_KEY = "flashcards"

@router.get("/flashcards/{video_id}")
async def get_flashcards(video_id: str, refresh: bool = False, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(404, "Không tìm thấy video")
    if not video.transcript or len(video.transcript) == 0:
        raise HTTPException(400, "Video chưa có bản ghi. Hãy tạo transcript trước.")

    cache = video.content_cache or {}
    if CACHE_KEY in cache and not refresh:
        return {"cards": cache[CACHE_KEY], "total": len(cache[CACHE_KEY]), "cached": True}

    transcript_text = " ".join(s["text"] for s in video.transcript)

    prompt = f"""Dựa vào nội dung video sau, hãy tạo 10-15 thẻ Flashcard để giúp học sinh ghi nhớ kiến thức quan trọng.

Nội dung: {transcript_text[:6000]}

Yêu cầu trả về ĐÚNG định dạng JSON là một danh sách:
[
  {{
    "front": "Thuật ngữ hoặc câu hỏi ngắn gọn (tiếng Việt)",
    "back": "Định nghĩa hoặc câu trả lời đầy đủ (tiếng Việt)",
    "category": "Nhóm chủ đề (ví dụ: Khái niệm / Công thức / Ứng dụng)"
  }}
]
Trả về JSON thuần túy, không có markdown."""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )
        content = response.choices[0].message.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        cards = json.loads(content)

        new_cache = {**cache, CACHE_KEY: cards}
        await db.execute(update(Video).where(Video.id == video.id).values(content_cache=new_cache))
        await db.commit()

        return {"cards": cards, "total": len(cards), "cached": False}
    except Exception as e:
        print(f"🔥 Flashcard Error: {e}")
        raise HTTPException(500, f"Lỗi tạo Flashcard: {str(e)}")
