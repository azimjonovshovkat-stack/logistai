import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

from app.core.config import get_settings
from app.services.cities import UZBEKISTAN_CITIES

router = APIRouter(tags=["misc"])
settings = get_settings()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


@router.post("/uploads/image")
async def upload_image(file: UploadFile):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Faqat JPG, PNG yoki WEBP rasm fayllari qabul qilinadi")

    contents = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(status_code=400, detail=f"Fayl hajmi {settings.max_upload_mb}MB dan oshmasligi kerak")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    (upload_dir / filename).write_bytes(contents)

    return {"url": f"/uploads/{filename}"}


@router.get("/cities")
async def list_cities():
    return {"cities": UZBEKISTAN_CITIES}
