import uuid, shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.database import get_db
from app.models import Video

router = APIRouter()

@router.post("/upload")
async def upload_video(file: UploadFile = File(...), db: AsyncSession = Depends(get_db), x_user_id: str = Header(None)):
    allowed_videos = {".mp4", ".mkv", ".avi", ".mov", ".webm"}
    allowed_docs = {".pdf", ".docx"}
    
    ext = Path(file.filename).suffix.lower()
    
    if ext in allowed_videos:
        media_type = "video"
    elif ext in allowed_docs:
        media_type = ext.replace(".", "") # 'pdf' or 'docx'
    else:
        raise HTTPException(400, f"Định dạng file {ext} không được hỗ trợ")

    file_id = str(uuid.uuid4())
    filename = f"{file_id}{ext}"
    dest = Path(settings.UPLOAD_DIR) / filename

    # Đảm bảo thư mục tồn tại
    dest.parent.mkdir(parents=True, exist_ok=True)

    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    user_uuid = uuid.UUID(x_user_id) if x_user_id else None

    # LƯU VÀO DATABASE
    new_video = Video(
        id=uuid.UUID(file_id),
        user_id=user_uuid,
        media_type=media_type,
        source_type="local",
        source_ref=filename,
        title=file.filename,
        status="completed"
    )
    db.add(new_video)
    await db.commit()
    await db.refresh(new_video)

    return {"id": file_id, "filename": filename, "media_type": media_type}
