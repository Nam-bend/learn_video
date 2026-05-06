from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db
from app.models import Video
from app.config import settings
from openai import AsyncOpenAI
import uuid
import json

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
        # Giả lập stream cho cache để frontend xử lý đồng nhất
        async def cached_stream():
            yield cache[CACHE_KEY]
        return StreamingResponse(cached_stream(), media_type="text/plain")

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

    async def stream_generator():
        full_summary = ""
        try:
            response = await client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                stream=True
            )
            
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_summary += content
                    yield content

            # Sau khi kết thúc stream, lưu vào DB
            if full_summary:
                from app.database import SessionLocal
                async with SessionLocal() as new_db:
                    # Lấy lại video object trong session mới
                    res = await new_db.execute(select(Video).where(Video.id == video.id))
                    v = res.scalar_one()
                    new_c = {**(v.content_cache or {}), CACHE_KEY: full_summary}
                    await new_db.execute(update(Video).where(Video.id == v.id).values(content_cache=new_c))
                    await new_db.commit()
        except Exception as e:
            print(f"🔥 Summary Stream Error: {e}")
            yield f"\n[Lỗi AI: {str(e)}]"

    return StreamingResponse(stream_generator(), media_type="text/plain")
