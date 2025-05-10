from fastapi import APIRouter, UploadFile, File
from database.supabase_client import save_to_supabase, update_file_data
# TODO: Implement and uncomment the following import from your supabase_client.py
from database.supabase_client import get_all_image_data_for_reprocessing
from .extract_text_and_keypoints import (
    extract_text_from_image,
    analyze_document_with_langchain,
    process_document_acceptance
)

from utils.google_vision import extract_text_from_image_using_google
import time
import asyncio
import os # Added for OPENAI_API_KEY
from langchain_openai import ChatOpenAI # Added for LLM call
import sys
import importlib


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


async def generate_combined_medical_summary_md(all_texts_concatenated: str) -> str:
    """
    Generates a comprehensive medical summary in Markdown format from combined medical texts
    using an LLM.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Warning: OPENAI_API_KEY environment variable not set. LLM calls may fail.")
        # Consider returning an error or using a mock response if the API key is critical and missing.
        # For now, Langchain will raise an error if the key is missing and required by the model.

    llm = ChatOpenAI( model_name="gpt-4.1-2025-04-14", openai_api_key=api_key)

    prompt = f"""You are a helpful medical assistant AI.
Analyze the following combined medical texts from multiple documents and generate a comprehensive medical summary in Markdown format.

The summary MUST include the following sections, in this order. If information for a particular section is not found in the provided texts, explicitly state "Information not found for this section." under the respective heading.
- Anamnese (Patient's medical history and reported symptoms)
- Befund (Clinical findings and observations)
- Procedere (Procedures performed or planned)
- Folgetermin (Follow-up appointments or recommendations)
- Diagnosen (Diagnoses made)
- Leistung (Services or treatments rendered/billed)

In addition to these core sections, identify and include any other medically relevant information present in the texts. This may include, but is not limited to:
- Lab results (e.g., blood tests, urine tests, biopsies) with values and reference ranges if available.
- Imaging results summaries.
- Specific measurements or vital signs.
- Medication lists or changes.
- Detailed observations or patient complaints not covered in Anamnese.

Present all information clearly and concisely.
Make full use of Markdown's capabilities for formatting to create a well-structured and easily readable report. This includes using:
- Headings (e.g., ## Section Name)
- Sub-headings (e.g., ### Subsection)
- Bullet points or numbered lists for items.
- Bold text for emphasis on key terms or values.
- Tables, if appropriate, for structured data like lab results (e.g., | Test | Result | Unit | Reference |).

Ensure the output is entirely in Markdown format, starting with a main heading like '# Comprehensive Medical Report'. Do not include any preamble before the Markdown content.

Combined Medical Texts:
---
{all_texts_concatenated}
---

Comprehensive Medical Summary (Markdown):
"""
    try:
        response = await llm.ainvoke(prompt)
        if hasattr(response, 'content'):
            return response.content
        else:
            # Fallback for different response structures
            return str(response)
    except Exception as e:
        print(f"Error during LLM call for summary: {str(e)}")
        return f"## Error in Generating Summary\\n\\nAn error occurred during the LLM call: {str(e)}"

# @router.get("/generate-comprehensive-report")
# async def trigger_comprehensive_report_generation():
#     """
#     Fetches all documents, processes them to extract text,
#     and then generates a combined medical summary in Markdown format.
#     """
#     documents_data = []
#     try:
#         # This is a placeholder for the actual function call.
#         # You need to implement `get_all_image_data_for_reprocessing` in `database/supabase_client.py`
#         # and ensure it's imported correctly at the top of this file.
#         # from database.supabase_client import get_all_image_data_for_reprocessing
#         if "get_all_image_data_for_reprocessing" in globals() or \
#            any(hasattr(mod, "get_all_image_data_for_reprocessing") for mod_name, mod in sys.modules.items() if "database.supabase_client" in mod_name and mod is not None):
#             # Dynamically get the function if it's available through an import
#             # This is a bit complex; a direct import is preferred once the function exists.
#             supabase_client_module = importlib.import_module("database.supabase_client")
#             if hasattr(supabase_client_module, "get_all_image_data_for_reprocessing"):
#                  get_all_image_data_for_reprocessing_func = getattr(supabase_client_module, "get_all_image_data_for_reprocessing")
#                  documents_data = await get_all_image_data_for_reprocessing_func()
#             else:
#                 raise ImportError("Function get_all_image_data_for_reprocessing not found in database.supabase_client")
#         else:
#             # This message will be shown if the function isn't available.
#             print("CRITICAL: `get_all_image_data_for_reprocessing` function not found or not imported. Please implement it in `database/supabase_client.py`.")
#             return {
#                 "error": "CRITICAL: `get_all_image_data_for_reprocessing` function not available. See server logs.",
#                 "summary_md": "", "documents_processed_successfully": 0, "total_documents_attempted": 0, "processing_errors": []
#             }

#     except ImportError: # Catches if the module or function isn't found by dynamic import
#         return {
#             "error": "Failed to import `get_all_image_data_for_reprocessing` from `database.supabase_client`. Please ensure it is implemented and the import path is correct.",
#             "summary_md": "", "documents_processed_successfully": 0, "total_documents_attempted": 0, "processing_errors": []
#         }
#     except Exception as e:
#         return {
#             "error": f"Failed to fetch documents from Supabase: {str(e)}. Ensure 'get_all_image_data_for_reprocessing' is implemented correctly.",
#             "summary_md": "", "documents_processed_successfully": 0, "total_documents_attempted": 0, "processing_errors": []
#         }

#     if not documents_data:
#          return {
#              "message": "No documents found in Supabase or `get_all_image_data_for_reprocessing` returned empty.",
#              "summary_md": "", "documents_processed_successfully": 0, "total_documents_attempted": 0, "processing_errors": []
#             }

#     all_extracted_texts = []
#     processing_errors = []
#     total_documents_attempted = len(documents_data)

#     for doc_data in documents_data:
#         image_bytes = doc_data.get("image_bytes")
#         content_type = doc_data.get("content_type")
#         image_id = doc_data.get("image_id", "N/A")

#         if not image_bytes or not content_type:
#             processing_errors.append(f"Missing image_bytes or content_type for document (ID: {image_id}). Skipping.")
#             continue
#         try:
#             result = await extract_text_and_keypoints_properly(image_bytes, content_type)
#             if isinstance(result, tuple):
#                 text, _ = result
#                 all_extracted_texts.append(text)
#             elif isinstance(result, dict) and "error" in result:
#                 error_message = result.get("error", "Unknown error during document processing")
#                 processing_errors.append(f"Error processing document (ID: {image_id}): {error_message}")
#             elif isinstance(result, str) and result.startswith("Error:"):
#                  processing_errors.append(f"Error processing document (ID: {image_id}): {result}")
#             else:
#                 processing_errors.append(f"Unexpected result type from extract_text_and_keypoints_properly for document (ID: {image_id}): {type(result)}")
#         except Exception as e:
#             processing_errors.append(f"Exception processing document (ID: {image_id}): {str(e)}")

#     if not all_extracted_texts:
#         return {
#             "message": "No text could be extracted from any of the documents. Cannot generate summary.",
#             "summary_md": "",
#             "documents_processed_successfully": 0,
#             "total_documents_attempted": total_documents_attempted,
#             "processing_errors": processing_errors
#         }

#     combined_text = "\\n\\n<!-- Document Separator -->\\n\\n".join(all_extracted_texts)
#     summary_md = ""
#     try:
#         summary_md = await generate_combined_medical_summary_md(combined_text)
#     except Exception as e:
#         return {
#             "error": f"Failed to generate medical summary via LLM: {str(e)}",
#             "summary_md": "Error during final summary generation.",
#             "documents_processed_successfully": len(all_extracted_texts),
#             "total_documents_attempted": total_documents_attempted,
#             "processing_errors": processing_errors
#         }

#     return {
#         "message": "Comprehensive report generation process completed.",
#         "summary_md": summary_md,
#         "documents_processed_successfully": len(all_extracted_texts),
#         "total_documents_attempted": total_documents_attempted,
#         "processing_errors": processing_errors if processing_errors else None
#     }
