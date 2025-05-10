from fastapi import APIRouter, UploadFile, File
from database.supabase_client import save_to_supabase
from .extract_text_and_keypoints import (
    extract_text_from_image,
    analyze_document_with_langchain,
    process_document_acceptance
)

router = APIRouter()


def extract_text_and_keypoints(image_bytes: bytes, content_type: str):
    """Processes an image: extracts text, analyzes it, and extracts keywords if accepted."""

    # Step 1: Extract text from image
    # The extract_text_from_image function from the other file returns the text or an error string.
    extracted_text_or_error = extract_text_from_image(
        image_bytes, content_type)

    if isinstance(extracted_text_or_error, str) and extracted_text_or_error.startswith("Error:"):
        return extracted_text_or_error, [f"Text extraction failed: {extracted_text_or_error}"]

    extracted_text = extracted_text_or_error

    # Step 2: Analyze the document (type, recency, clarity)
    # This returns: validation_result, recency_result, clarity_score, llm_instance
    # Or: error_message, None, None, None (if API key issue)
    val_res, rec_res, clar_score, llm_instance = analyze_document_with_langchain(
        extracted_text,
        document_type="report"  # Defaulting to "report", can be parameterized later
    )

    if llm_instance is None:  # Indicates API key error from analyze_document_with_langchain
        return extracted_text, [f"Document analysis failed: {val_res}"]

    # Step 3: Process acceptance and conditionally get keywords
    # This returns a dict with "accepted", "error", and optionally "data" and "get_keywords"
    acceptance_output = process_document_acceptance(
        extracted_text, val_res, rec_res, clar_score, llm_instance
    )

    if acceptance_output.get("accepted"):
        text_to_return = acceptance_output.get(
            "data", {}).get("text", extracted_text)
        get_keywords_func = acceptance_output.get("get_keywords")

        keywords_list = []
        if callable(get_keywords_func):
            try:
                keywords_list = get_keywords_func()  # This makes the LLM call for keywords
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


@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), doc_type: str = "Clinical Report"):
    print(f"Received file: {file.filename} of type {doc_type}")
    image_bytes = await file.read()
    result = extract_text_and_keypoints(image_bytes)
    if isinstance(result, tuple):
        text, keypoints = result
        save_to_supabase(image_bytes, file, text, keypoints, doc_type)
        return {"success": True}
    else:
        accepted = result.get("accepted")
        error = result.get("error")
        return {"success": False, "error": error}
