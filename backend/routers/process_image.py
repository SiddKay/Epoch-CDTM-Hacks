from fastapi import APIRouter, UploadFile, File
from database.supabase_client import save_to_supabase

router = APIRouter()


def extract_text_and_keypoints(image_bytes: bytes):
    # Placeholder for image processing logic
    # Return dummy text and key points
    return "Extracted text", "Key points"


@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), doc_type: str = "Clinical Report"):
    print(f"Received file: {file.filename} of type {doc_type}")
    image_bytes = await file.read()
    text, keypoints = extract_text_and_keypoints(image_bytes)
    save_to_supabase(image_bytes, file, text, keypoints, doc_type)
    return {"text": text, "keypoints": keypoints}
