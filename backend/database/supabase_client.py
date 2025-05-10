import uuid

from starlette.datastructures import UploadFile
from supabase import create_client, Client
from datetime import datetime, timezone

SUPABASE_URL = "https://oaiygtecjjepjuebfeai.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXlndGVjamplcGp1ZWJmZWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MzI2NzksImV4cCI6MjA2MjQwODY3OX0.uRXx1L6THPziMWkmusY9zkdMnzBJWrP4ay4NCHVQ_Ic"


def get_supabase_client() -> Client:
    """Initializes and returns a Supabase client using environment variables."""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def save_to_supabase(image_bytes: bytes, image: UploadFile, text: str, keypoints: str):
    """
    Uploads the image to Supabase Storage and saves file metadata to the grandma_files table.
    """
    supabase = get_supabase_client()

    # Generate a unique file path
    image_id = str(uuid.uuid4())
    file_path = f"{image_id}_{image.filename}"

    # Upload image to Supabase storage
    try:
        storage_response = supabase.storage.from_("uploads").upload(
            path=file_path,
            file=image_bytes,
            file_options={
                "content-type": image.content_type,
                "x-upsert": "true"
            },
        )
    except Exception as e:
        raise Exception(f"Failed to upload image to Supabase: {str(e)}")

    # Get public URL of uploaded image
    preview_url = supabase.storage.from_("uploads").get_public_url(file_path)

    # Prepare metadata for database
    data = {
        "file_name": image.filename,
        "file_path": file_path,
        "file_type": image.content_type,
        "file_size": image.size,
        "upload_date": datetime.now(timezone.utc).isoformat(),
        "preview_url": preview_url,
        "text": text,
        "keypoints": keypoints,
    }

    # Insert metadata into Supabase table
    insert_response = supabase.table("grandma_files").insert(data).execute()

    if not insert_response.data:
        raise Exception(f"Failed to insert metadata into database: {insert_response}")

    return {"preview_url": preview_url, **data}