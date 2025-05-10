import uuid
import os
from starlette.datastructures import UploadFile
from supabase import create_client, Client
from datetime import datetime, timezone

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


def save_to_supabase(image_bytes: bytes, image: UploadFile, text: str, keypoints: str, doc_type: str):
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
        "doc_type": doc_type,
    }

    # Insert metadata into Supabase table
    insert_response = supabase.table("grandma_files").insert(data).execute()

    if not insert_response.data:
        raise Exception(
            f"Failed to insert metadata into database: {insert_response}")

    return {"image_id": image_id, "preview_url": preview_url, **data}


def update_file_data(image_id: str, text: str, keypoints: str):
    """
    Updates the file data in the database.
    """
    supabase = get_supabase_client()
    supabase.table("grandma_files").update({
        "text": text,
        "keypoints": keypoints
    }).eq("id", image_id).execute()

    return {"success": True}


async def get_all_image_data_for_reprocessing():
    """
    Fetches all records from the grandma_files table and downloads the associated image bytes.

    Returns:
        A list of dictionaries, where each dictionary contains:
        - 'image_id': The UUID of the image record.
        - 'image_bytes': The raw bytes of the image file.
        - 'content_type': The content type of the image file.
    """
    supabase = get_supabase_client()
    processed_documents = []
    error_messages = []

    try:
        # Fetch all records from the 'grandma_files' table
        response = supabase.table("grandma_files").select("id, file_path, file_type").execute()

        if not response.data:
            print("No documents found in grandma_files table.")
            return [], ["No documents found in grandma_files table."]

        for record in response.data:
            image_id = record.get("id")
            file_path = record.get("file_path")
            content_type = record.get("file_type")

            if not file_path:
                error_msg = f"Skipping record ID {image_id}: 'file_path' is missing."
                print(error_msg)
                error_messages.append(error_msg)
                continue

            if not content_type:
                # Default to a generic content type if missing, though it's better if it's always present
                print(f"Warning: 'file_type' (content_type) is missing for record ID {image_id}. Defaulting to 'application/octet-stream'.")
                content_type = "application/octet-stream"


            try:
                # Download the image from Supabase Storage
                # The download method returns the bytes directly
                image_bytes_response = supabase.storage.from_("uploads").download(file_path)

                # The response from download() should be the bytes themselves.
                # If it were an HTTP response object, you'd access .content, but supabase-py returns bytes directly.
                if isinstance(image_bytes_response, bytes):
                    processed_documents.append({
                        "image_id": image_id,
                        "image_bytes": image_bytes_response,
                        "content_type": content_type
                    })
                else:
                    # This case should not happen with current supabase-py behavior for successful downloads
                    error_msg = f"Failed to download or process image for record ID {image_id} from path '{file_path}'. Unexpected response type: {type(image_bytes_response)}"
                    print(error_msg)
                    error_messages.append(error_msg)

            except Exception as e:
                error_msg = f"Error downloading image for record ID {image_id} from path '{file_path}': {str(e)}"
                print(error_msg)
                error_messages.append(error_msg)
                # Optionally, decide if one failed download should stop the whole process or just be skipped

    except Exception as e:
        error_msg = f"An error occurred while fetching records from Supabase: {str(e)}"
        print(error_msg)
        # If we can't even fetch the list of files, return empty and the main error
        return [], [error_msg]

    if error_messages:
        print(f"Completed fetching with some errors: {error_messages}")
    else:
        print(f"Successfully fetched and processed {len(processed_documents)} documents.")

    return processed_documents # Return the list of successfully processed documents and any accumulated errors
