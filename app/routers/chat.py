from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Video, ChatMessage
from app.config import settings
from openai import AsyncOpenAI
import uuid

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

    transcript_text = " ".join(s["text"] for s in (video.transcript or []))

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",  # ← chỉ cần tên model gọn thôi
            messages=[
                {"role": "system", "content": "Bạn là một trợ lý học tập. Hãy dựa vào nội dung video được cung cấp để trả lời câu hỏi của người dùng."},
                {"role": "user", "content": f"Nội dung video: {transcript_text}\n\nCâu hỏi: {question}"}
            ]
        )
        answer = response.choices[0].message.content

        if not answer:
            raise Exception("AI không trả về nội dung")

        db.add(ChatMessage(video_id=video.id, role="user", content=question))
        db.add(ChatMessage(video_id=video.id, role="assistant", content=answer))
        await db.commit()

        return {"answer": answer}

    except Exception as e:
        print(f"🔥 OpenAI Error: {e}")
        raise HTTPException(500, f"Lỗi gọi AI: {str(e)}")

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