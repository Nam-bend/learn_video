import uuid, shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import settings

router = APIRouter()

@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    allowed = {".mp4", ".mkv", ".avi", ".mov", ".webm"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed:
        raise HTTPException(400, "Định dạng file không được hỗ trợ")

    file_id = str(uuid.uuid4())
    filename = f"{file_id}{ext}"
    dest = Path(settings.UPLOAD_DIR) / filename

    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"id": file_id, "filename": filename}