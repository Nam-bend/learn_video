from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db
from app.models import Video
from app.config import settings
from openai import AsyncOpenAI
import uuid

router = APIRouter()
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)

CACHE_KEY = "summary"

@router.get("/summary/{video_id}")
async def get_summary(video_id: str, refresh: bool = False, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(404, "Không tìm thấy video")
    if not video.transcript or len(video.transcript) == 0:
        raise HTTPException(400, "Video chưa có bản ghi. Hãy tạo transcript trước.")

    # Return cached result if available
    cache = video.content_cache or {}
    if CACHE_KEY in cache and not refresh:
        return {"summary": cache[CACHE_KEY], "video_title": video.title, "cached": True}

    transcript_text = " ".join(s["text"] for s in video.transcript)

    prompt = f"""Bạn là một giáo viên chuyên nghiệp. Dưới đây là nội dung được phiên âm từ một video học tập (có thể bằng tiếng Anh hoặc tiếng Việt lẫn lộn).

Nhiệm vụ của bạn:
1. Dịch toàn bộ nội dung sang tiếng Việt chuẩn, tự nhiên và dễ hiểu.
2. Tổ chức lại thành một bản tóm tắt học tập đầy đủ theo cấu trúc sau:

## 📋 Tổng quan
(Mô tả ngắn gọn chủ đề và mục tiêu của video trong 2-3 câu)

## 🎯 Các điểm chính
(Liệt kê 5-8 ý chính quan trọng nhất dưới dạng bullet point, mỗi điểm có giải thích rõ ràng)

## 📖 Nội dung chi tiết
(Trình bày đầy đủ toàn bộ nội dung theo từng phần/chủ đề, có tiêu đề phụ rõ ràng. Đây là phần quan trọng nhất - hãy giải thích chi tiết để học sinh hiểu hết.)

## 💡 Khái niệm cần nhớ
(Các thuật ngữ, khái niệm, công thức quan trọng kèm định nghĩa ngắn gọn)

## ✅ Kết luận
(Tóm tắt những gì đã học được và ứng dụng thực tế nếu có)

Nội dung video: {transcript_text[:8000]}

Hãy trả lời bằng tiếng Việt, chi tiết và đầy đủ nhất có thể."""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )
        summary = response.choices[0].message.content

        # Cache the result
        new_cache = {**cache, CACHE_KEY: summary}
        await db.execute(update(Video).where(Video.id == video.id).values(content_cache=new_cache))
        await db.commit()

        return {"summary": summary, "video_title": video.title, "cached": False}
    except Exception as e:
        print(f"🔥 Summary Error: {e}")
        raise HTTPException(500, f"Lỗi tạo tóm tắt: {str(e)}")
