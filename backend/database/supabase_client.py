# Placeholder for Supabase client setup

import os
from supabase import create_client, Client
from typing import List

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
BUCKET_NAME = os.environ.get("SUPABASE_BUCKET", "images")
TABLE_NAME = os.environ.get("SUPABASE_TABLE", "documents")


def get_supabase_client() -> Client:
    """Initializes and returns a Supabase client using environment variables."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase URL and Key must be set in environment variables.")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def save_to_supabase(image_bytes: bytes, text: str, keypoints: List[str]):
    """
    Uploads the image to Supabase Storage and saves metadata (text, keypoints, image URL) to a table.
    """
    supabase = get_supabase_client()

    # Generate a unique file name
    import uuid
    image_id = str(uuid.uuid4())
    image_path = f"uploads/{image_id}.png"

    # Upload image to storage bucket
    storage_response = supabase.storage.from_(BUCKET_NAME).upload(
        path=image_path,
        file=image_bytes,
        file_options={"content-type": "image/png", "upsert": True}
    )
    if storage_response.get("error"):
        raise Exception(f"Failed to upload image: {storage_response['error']['message']}")

    # Get public URL for the image
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(image_path)

    # Insert metadata into the table
    data = {
        "image_url": public_url,
        "text": text,
        "keypoints": keypoints,
    }
    insert_response = supabase.table(TABLE_NAME).insert(data).execute()
    if insert_response.get("error"):
        raise Exception(f"Failed to insert metadata: {insert_response['error']['message']}")

    return {"image_url": public_url, "text": text, "keypoints": keypoints} 