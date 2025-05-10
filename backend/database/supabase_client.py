import uuid
import os
from starlette.datastructures import UploadFile
from supabase import create_client, Client
from datetime import datetime, timezone
from typing import Optional

import dotenv

dotenv.load_dotenv()


def get_supabase_client() -> Client:
    """Initializes and returns a Supabase client using environment variables."""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        # This error will only be raised if a function actually tries to get a Supabase client
        # and the environment variables are not set.
        raise EnvironmentError(
            "SUPABASE_URL and SUPABASE_KEY environment variables must be set "
            "to initialize the Supabase client."
        )
    return create_client(supabase_url, supabase_key)


def save_to_supabase(
    image_bytes: Optional[bytes],
    image: Optional[UploadFile],
    text: Optional[str],
    keypoints: Optional[str],
    doc_type: str,
):
    """
    Uploads the image to Supabase Storage and saves file metadata to the grandma_files table.
    Handles cases where image_bytes and image might be None (e.g., "Not Available" document).
    """
    supabase = get_supabase_client()
    image_id = str(uuid.uuid4())

    # ---------- 1. decide if there is a real file ----------
    # A real file exists if image_bytes is present, image object is present,
    # and that image object has a filename attribute.
    has_file = bool(image_bytes and image and getattr(image, "filename", None))

    if has_file:
        file_path   = f"{image_id}_{image.filename}"
        try:
            supabase.storage.from_("uploads").upload(
                path=file_path,
                file=image_bytes,
                file_options={
                    "content-type": image.content_type,
                    "x-upsert": "true",
                },
            )
        except Exception as e:
            raise Exception(f"Failed to upload image to Supabase: {str(e)}")

        preview_url = supabase.storage.from_("uploads").get_public_url(file_path)
        file_name   = image.filename
        file_type   = image.content_type
        # Use getattr for size for compatibility with our MinimalUploadFileEmulator and real UploadFile
        file_size   = getattr(image, "size", len(image_bytes) if image_bytes else 0)
    else:
        # ---------- 2. "Not available" path ----------
        file_path   = f"path/not_available"
        preview_url = None
        file_name   = f"{doc_type.lower().replace(' ', '_')}_not_available.txt"  # placeholder name
        file_type   = "text/plain"
        file_size   = 0

    # ---------- 3. insert a row either way ----------
    data = {
        "id":            image_id,
        "file_name":     file_name,
        "file_path":     file_path,
        "file_type":     file_type,
        "file_size":     file_size,
        "upload_date":   datetime.now(timezone.utc).isoformat(),
        "preview_url":   preview_url,
        "text":          text,
        "keypoints":     keypoints,
        "doc_type":      doc_type,
    }

    insert_response = supabase.table("grandma_files").insert(data).execute()

    # Check if the insert was successful, often Supabase client might not raise an error
    # but the response will indicate failure (e.g., empty data array or specific error structure)
    if not insert_response.data and not (hasattr(insert_response, 'error') and insert_response.error is None):
        # Attempt to get more specific error info if available
        error_info = getattr(insert_response, 'error', 'Unknown error')
        print(f"Failed to insert metadata into database. Response: {insert_response}")
        raise Exception(
            f"Failed to insert metadata into database: {error_info}"
        )
    
    return {"image_id": image_id, "preview_url": preview_url}


def update_file_data(image_id: str, text: str, keypoints: list):
    """
    Updates the file data in the database.
    """
    supabase = get_supabase_client()
    supabase.table("grandma_files").update({
        "text": text,
        "keypoints": keypoints
    }).eq("id", image_id).execute()

    return {"success": True}


def get_all_image_data_for_reprocessing() -> str:
    """
    Fetches all records from the grandma_files table and downloads the associated image bytes.

    Returns:
        A string containing all the text from the documents.
    """
    supabase = get_supabase_client()
    processed_documents = []

    try:
        # Fetch all records from the 'grandma_files' table
        response = supabase.table("grandma_files").select(
            "doc_type", "text", "preview_url", "file_name").execute()

        if not response.data:
            print("No documents found in grandma_files table.")
            return [], ["No documents found in grandma_files table."]

        text_list = []
        raw_texts = set()
        ref_number = 1
        references = []
        for record in response.data:
            text = record.get("text")
            doc_type = record.get("doc_type")
            url = record.get("preview_url")
            file_name = record.get("file_name")
            if not text:
                continue

            if text in raw_texts:
                continue
            raw_texts.add(text)

            if not doc_type:
                doc_type = "Unknown"

            full_text = f"Document type: {doc_type}\nReference: [({ref_number})]({url})\n---\n{text}"
            text_list.append(full_text)
            ref_number += 1
            references.append((ref_number, file_name, url))
        text = '\n\n'.join(text_list)
        text += "\n\nReferences:\n"
        for ref_number, file_name, url in references:
            text += f" - ({ref_number}) [{file_name}]({url})\n"
        return text.strip()

    except Exception as e:
        print(f"Error fetching records from Supabase: {str(e)}")

    # Return the list of successfully processed documents and any accumulated errors
    return processed_documents


def save_grandma_report(report: str):
    """
    Saves the comprehensive report to the grandma_reports table.
    """
    supabase = get_supabase_client()
    supabase.table("grandma_reports").insert(
        {"id": str(uuid.uuid4()), "text": report}).execute()


def get_grandma_report_db() -> str:
    """
    Fetches the comprehensive report from the grandma_reports table.
    """
    supabase = get_supabase_client()
    response = supabase.table("grandma_reports").select(
        "text").order("created_at", desc=True).limit(1).execute()
    if not response.data:
        return None
    return response.data[0]["text"]
