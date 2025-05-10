from fastapi import APIRouter, UploadFile, File
from database.supabase_client import save_to_supabase, update_file_data
from .extract_text_and_keypoints import (
    extract_text_from_image,
    analyze_document_with_langchain,
    process_document_acceptance
)

from utils.google_vision import extract_text_from_image_using_google
import time
import asyncio


router = APIRouter()


async def extract_text_and_keypoints_properly(image_bytes: bytes, content_type: str):
    """Processes an image: extracts text, analyzes it, and extracts keywords if accepted."""

    # Step 1: Extract text from image
    # The extract_text_from_image function from the other file returns the text or an error string.
    start_text_extraction = time.time()
    extracted_text_or_error = await extract_text_from_image(
        image_bytes, content_type)
    text_extraction_time = time.time() - start_text_extraction
    print(f"Time to extract text: {text_extraction_time:.2f} seconds")

    if isinstance(extracted_text_or_error, str) and extracted_text_or_error.startswith("Error:"):
        return extracted_text_or_error, [f"Text extraction failed: {extracted_text_or_error}"]

    extracted_text = extracted_text_or_error

    # Step 2: Analyze the document (type, recency, clarity)
    # This returns: validation_result, recency_result, clarity_score, llm_instance
    # Or: error_message, None, None, None (if API key issue)
    start_document_analysis = time.time()
    val_res, rec_res, clar_score, llm_instance = await analyze_document_with_langchain(
        extracted_text,
        document_type="report"  # Defaulting to "report", can be parameterized later
    )
    document_analysis_time = time.time() - start_document_analysis
    print(f"Time to analyze document: {document_analysis_time:.2f} seconds")

    if llm_instance is None:  # Indicates API key error from analyze_document_with_langchain
        return extracted_text, [f"Document analysis failed: {val_res}"]

    # Step 3: Process acceptance and conditionally get keywords
    # This returns a dict with "accepted", "error", and optionally "data" and "get_keywords"
    start_acceptance_processing = time.time()
    acceptance_output = await process_document_acceptance(
        extracted_text, val_res, rec_res, clar_score, llm_instance
    )
    acceptance_processing_time = time.time() - start_acceptance_processing
    print(
        f"Time to process document acceptance: {acceptance_processing_time:.2f} seconds")

    if acceptance_output.get("accepted"):
        text_to_return = acceptance_output.get(
            "data", {}).get("text", extracted_text)
        get_keywords_func = acceptance_output.get("get_keywords")

        keywords_list = []
        if callable(get_keywords_func):
            try:
                start_keyword_extraction = time.time()
                # This makes the LLM call for keywords
                keywords_list = await get_keywords_func()
                keyword_extraction_time = time.time() - start_keyword_extraction
                print(
                    f"Time to extract keywords: {keyword_extraction_time:.2f} seconds")
            except Exception as e:
                # Log this error, as keyword extraction failed post-acceptance
                print(f"Error during on-demand keyword extraction: {str(e)}")
                keywords_list = ["Error during keyword extraction."]
        else:
            # This case should ideally not be reached if accepted and llm_instance was valid
            keywords_list = ["Keyword extraction function was not available."]

        return text_to_return, keywords_list
    else:
        # Document was not accepted by process_document_acceptance
        return acceptance_output


async def validate_image_quickly(image_bytes: bytes):
    """Extract text and validate it using Google Vision."""

    # Step 1: Extract text from image
    # The extract_text_from_image function from the other file returns the text or an error string.
    try:
        start_text_extraction = time.time()
        extracted_text = extract_text_from_image_using_google(image_bytes)
        text_extraction_time = time.time() - start_text_extraction
        print(f"Time to extract text: {text_extraction_time:.2f} seconds")
    except Exception as e:
        return {"accepted": False, "error": f"Text extraction failed: {str(e)}"}

    # Step 2: Analyze the document (type, recency, clarity)
    # This returns: validation_result, recency_result, clarity_score, llm_instance
    # Or: error_message, None, None, None (if API key issue)
    start_document_analysis = time.time()
    val_res, rec_res, clar_score, llm_instance = await analyze_document_with_langchain(
        extracted_text,
        document_type="report"  # Defaulting to "report", can be parameterized later
    )
    document_analysis_time = time.time() - start_document_analysis
    print(f"Time to analyze document: {document_analysis_time:.2f} seconds")

    if llm_instance is None:  # Indicates API key error from analyze_document_with_langchain
        return extracted_text, [f"Document analysis failed: {val_res}"]

    # Step 3: Process acceptance and conditionally get keywords
    # This returns a dict with "accepted", "error", and optionally "data" and "get_keywords"
    start_acceptance_processing = time.time()
    acceptance_output = await process_document_acceptance(
        extracted_text, val_res, rec_res, clar_score, llm_instance
    )
    acceptance_processing_time = time.time() - start_acceptance_processing
    print(
        f"Time to process document acceptance: {acceptance_processing_time:.2f} seconds")
    return acceptance_output


@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), doc_type: str = "Clinical Report"):
    print(f"Received file: {file.filename} of type {doc_type}")
    image_bytes = await file.read()

    # Measure time for extract_text_and_keypoints
    start_extract_time = time.time()
    result = await validate_image_quickly(image_bytes)
    extract_time = time.time() - start_extract_time
    print(f"Time to validate image: {extract_time:.2f} seconds")

    accepted = result.get("accepted")
    error = result.get("error")

    # Save to Supabase and get the image_id
    saved_data = save_to_supabase(image_bytes, image=file, text=None,
                                  keypoints=None, doc_type=doc_type)

    # Start background task for processing the image properly
    image_id = saved_data.get("image_id")
    content_type = file.content_type

    # Create a copy of image_bytes for the background task
    image_bytes_copy = image_bytes

    # Start background task
    asyncio.create_task(process_image_properly(
        image_id, image_bytes_copy, content_type))

    return {"success": accepted, "error": error}


async def process_image_properly(image_id: str, image_bytes: bytes, content_type: str):
    try:
        # Step 1: Extract text and keypoints
        start_extract_time = time.time()
        result = await extract_text_and_keypoints_properly(image_bytes, content_type)
        extract_time = time.time() - start_extract_time
        print(
            f"Time to extract text and keypoints: {extract_time:.2f} seconds")

        if isinstance(result, tuple):
            text, keypoints = result

            # Measure time for save_to_supabase
            start_save_time = time.time()
            update_file_data(image_id, text, keypoints)
            save_time = time.time() - start_save_time
            print(f"Time to save to Supabase: {save_time:.2f} seconds")

            return {"success": True}
        else:
            accepted = result.get("accepted")
            error = result.get("error")
            return {"success": accepted, "error": error}
    except Exception as e:
        print(f"Error in process_image_properly: {str(e)}")
        return {"success": False, "error": str(e)}
