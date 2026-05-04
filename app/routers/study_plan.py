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

CACHE_KEY = "study_plan"

@router.get("/study-plan/{video_id}")
async def get_study_plan(video_id: str, refresh: bool = False, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(404, "Không tìm thấy video")
    if not video.transcript or len(video.transcript) == 0:
        raise HTTPException(400, "Video chưa có bản ghi. Hãy tạo transcript trước.")

    cache = video.content_cache or {}
    if CACHE_KEY in cache and not refresh:
        return {"plan": cache[CACHE_KEY], "video_title": video.title, "cached": True}

    transcript_text = " ".join(s["text"] for s in video.transcript)

    prompt = f"""Bạn là một huấn luyện viên học tập (Learning Coach) đầy nhiệt huyết. Dựa vào nội dung video dưới đây, hãy xây dựng một lộ trình học tập 7 ngày mang tính thực tế cao, giúp người học làm chủ kiến thức mà không bị ngợp. Hãy viết với giọng điệu động viên, tự nhiên và gần gũi.

Nội dung video: {transcript_text[:6000]}

Yêu cầu định dạng (sử dụng Markdown, tiếng Việt tự nhiên):

## 🗺️ Hành trình 7 ngày làm chủ kiến thức

### 🎯 Mục tiêu cuối cùng
[Viết 1-2 câu truyền cảm hứng về những gì người học sẽ đạt được sau 7 ngày này]

### 🛠️ Hành trang cần chuẩn bị
- **Trọng tâm:** [Chủ đề chính là gì?]
- **Thời gian cam kết:** Mỗi ngày khoảng 30-45 phút.
- **Tâm thế:** [1 câu khuyên nhủ trước khi bắt đầu]

### 📆 Lộ trình thực chiến (7 ngày)

**Ngày 1: Phá băng & Làm quen cơ bản**
- [ ] [Hành động cụ thể 1] (⏳ 15p)
- [ ] [Hành động cụ thể 2] (⏳ 20p)
- 💡 *Mẹo của Coach:* [Một lời khuyên nhỏ để giữ động lực cho ngày đầu tiên]

**Ngày 2: Đào sâu khái niệm cốt lõi**
- [ ] [Hành động]
- [ ] [Hành động]
- 💡 *Mẹo của Coach:* [...]

[Tiếp tục sáng tạo cho Ngày 3 đến Ngày 7. Đảm bảo các hoạt động thiết thực, ví dụ: ôn lại, làm bài tập nhỏ, tự đặt câu hỏi, hoặc áp dụng vào thực tế. Đừng bắt học sinh chỉ "đọc lại ghi chú".]

### 🏆 Chốt chặng & Tự thưởng
[Hướng dẫn cách người học tự kiểm tra xem mình đã hiểu bài chưa (ví dụ: thử giải thích cho người khác nghe). Và một lời chúc mừng/động viên hoàn thành!]

Lưu ý: 
- KHÔNG dùng ngôn ngữ máy móc (như "Dưới đây là kế hoạch...").
- Các "Hành động" (bullet points) bắt buộc phải bắt đầu bằng `- [ ] ` để tạo checkbox.
- Các hành động phải thật cụ thể (VD: "Tự viết ra 3 ví dụ về X" thay vì "Học hiểu X")."""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )
        plan = response.choices[0].message.content

        new_cache = {**cache, CACHE_KEY: plan}
        await db.execute(update(Video).where(Video.id == video.id).values(content_cache=new_cache))
        await db.commit()

        return {"plan": plan, "video_title": video.title, "cached": False}
    except Exception as e:
        print(f"🔥 Study Plan Error: {e}")
        raise HTTPException(500, f"Lỗi tạo kế hoạch: {str(e)}")
