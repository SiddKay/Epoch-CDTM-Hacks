import os
import httpx
from fastapi import APIRouter, Response, status
from fastapi import APIRouter, UploadFile, File
from typing import Optional
from database.supabase_client import save_to_supabase, update_file_data
# TODO: Implement and uncomment the following import from your supabase_client.py
from database.supabase_client import get_all_image_data_for_reprocessing, save_grandma_report, get_grandma_report_db
from .extract_text_and_keypoints import (
    extract_text_from_image,
    analyze_document_with_langchain,
    process_document_acceptance
)

from utils.google_vision import extract_text_from_image_using_google
import time
import asyncio
import os  # Added for OPENAI_API_KEY
from langchain_openai import ChatOpenAI  # Added for LLM call


router = APIRouter()


async def extract_text_and_keypoints_properly(image_bytes: bytes, content_type: str, doc_type: str):
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
        document_type=doc_type  # Use the passed doc_type
    )
    document_analysis_time = time.time() - start_document_analysis
    print(f"Time to analyze document: {document_analysis_time:.2f} seconds")

    if llm_instance is None:  # Indicates API key error from analyze_document_with_langchain
        return extracted_text, [f"Document analysis failed: {val_res}"]

    # Step 3: Process acceptance and conditionally get keywords
    # This returns a dict with "accepted", "error", and optionally "data" and "get_keywords"
    start_acceptance_processing = time.time()
    acceptance_output = await process_document_acceptance(
        extracted_text, val_res, rec_res, clar_score, llm_instance, doc_type  # Pass doc_type
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


async def validate_image_quickly(image_bytes: bytes, doc_type: str) -> tuple[dict, str | None]:
    """Extract text and validate it using Google Vision."""

    allowed_doc_types = [
        'Insurance Card',
        "Doctor's Letter",
        'Vaccination Card',
        'Lab Report',
        'Anything else?'
    ]
    if doc_type not in allowed_doc_types:
        return {"accepted": False, "error": f"Invalid document type: {doc_type}. Allowed types are: {', '.join(allowed_doc_types)}"}, None

    # Step 1: Extract text from image
    # The extract_text_from_image function from the other file returns the text or an error string.
    try:
        start_text_extraction = time.time()
        extracted_text = extract_text_from_image_using_google(image_bytes)
        text_extraction_time = time.time() - start_text_extraction
        print(f"Time to extract text: {text_extraction_time:.2f} seconds")
    except Exception as e:
        return {"accepted": False, "error": f"Text extraction failed: {str(e)}"}, None

    # Step 2: Analyze the document (type, recency, clarity)
    # This returns: validation_result, recency_result, clarity_score, llm_instance
    # Or: error_message, None, None, None (if API key issue)
    start_document_analysis = time.time()
    val_res, rec_res, clar_score, llm_instance = await analyze_document_with_langchain(
        extracted_text,
        document_type=doc_type  # Use the passed doc_type
    )
    document_analysis_time = time.time() - start_document_analysis
    print(f"Time to analyze document: {document_analysis_time:.2f} seconds")

    if llm_instance is None:  # Indicates API key error from analyze_document_with_langchain
        return {"accepted": False, "error": "Document analysis failed: API key error"}, extracted_text

    # Step 3: Process acceptance and conditionally get keywords
    # This returns a dict with "accepted", "error", and optionally "data" and "get_keywords"
    start_acceptance_processing = time.time()
    acceptance_output = await process_document_acceptance(
        extracted_text, val_res, rec_res, clar_score, llm_instance, doc_type  # Pass doc_type
    )
    acceptance_processing_time = time.time() - start_acceptance_processing
    print(
        f"Time to process document acceptance: {acceptance_processing_time:.2f} seconds")
    return acceptance_output, extracted_text


@router.post("/upload-image")
async def upload_image(file: UploadFile, doc_type: str = "Clinical Report"):
    # Existing code for when a file is uploaded
    print(f"Received file: {file.filename} of type {doc_type}")
    image_bytes = await file.read()

    # Measure time for extract_text_and_keypoints
    start_extract_time = time.time()
    result, extracted_text = await validate_image_quickly(image_bytes, doc_type)
    extract_time = time.time() - start_extract_time
    print(f"Time to validate image: {extract_time:.2f} seconds")

    accepted = result.get("accepted")
    error = result.get("error")

    # Save to Supabase and get the image_id
    saved_data = save_to_supabase(image_bytes, image=file, text=extracted_text,
                                  keypoints=None, doc_type=doc_type)

    # Start background task for processing the image properly
    image_id = saved_data.get("image_id")
    content_type = file.content_type

    # Create a copy of image_bytes for the background task
    image_bytes_copy = image_bytes

    # Start background task
    asyncio.create_task(process_image_properly(
        image_id, image_bytes_copy, content_type, doc_type=doc_type  # Added doc_type
    ))

    return {"success": accepted, "error": error}


async def process_image_properly(image_id: str, image_bytes: Optional[bytes], content_type: Optional[str], doc_type: str):
    try:
        if image_bytes is None:
            # Handle "Not Available" case for the given doc_type
            not_available_text = f"This document ({doc_type}) was marked as not available by the user."
            not_available_keypoints = []  # No keypoints for a non-existent document

            print(
                f"Processing image_id {image_id} ({doc_type}) as 'Not Available' in background.")
            update_file_data(image_id, not_available_text,
                             not_available_keypoints)
            print(
                f"Updated image_id {image_id} with 'Not Available' status for {doc_type}.")
            return {"success": True, "message": f"{doc_type} processed as 'Not Available'."}

        # Step 1: Extract text and keypoints
        start_extract_time = time.time()
        result = await extract_text_and_keypoints_properly(image_bytes, content_type, doc_type)
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
    # print(
    # f"Generating comprehensive medical summary from: {all_texts_concatenated}")
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Warning: OPENAI_API_KEY environment variable not set. LLM calls may fail.")
        # Consider returning an error or using a mock response if the API key is critical and missing.
        # For now, Langchain will raise an error if the key is missing and required by the model.

    llm = ChatOpenAI(model_name="gpt-4o", openai_api_key=api_key)

    prompt = f"""You are a helpful medical assistant AI.
Analyze the following combined medical texts from multiple documents and generate a comprehensive medical summary in Markdown format.

The summary MUST include the following sections, in this order. If information for a particular section is not found in the provided texts, explicitly state "Information not found for this section." under the respective heading.
- Anamnese (Patient's medical history and reported symptoms)
- Befund (Clinical findings and observations)
- Procedere (Procedures performed or planned)
- Folgetermin (Follow-up appointments or recommendations)
- Diagnosen (Diagnoses made)
- Leistung (Services or treatments rendered/billed)
- Referenzen (References to the original documents)

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

Please also include the references to the original documents as [(<number>)](url) for every section. Make sure to support every statement with a reference so that the doctor can verify the information!

Combined Medical Texts:
---
{all_texts_concatenated}
---

Comprehensive Medical Summary (Markdown):
"""
    try:
        response = await llm.ainvoke(prompt)
        if hasattr(response, 'content'):
            print(f"Generated summary: {response.content}")
            return response.content
        else:
            # Fallback for different response structures
            return str(response)
    except Exception as e:
        print(f"Error during LLM call for summary: {str(e)}")
        raise


@router.get("/trigger-report-generation")
async def trigger_comprehensive_report_generation():
    all_texts_concatenated = get_all_image_data_for_reprocessing()
    if not all_texts_concatenated:
        return {"success": False, "error": "No texts to process"}

    # Create a task that generates the comprehensive report
    asyncio.create_task(
        generate_save_report(all_texts_concatenated))

    # Return immediately while processing continues in background
    return {"success": True, "result": "Report generation started in background. The results will be available to the doctor shortly."}


@router.get("/get-report")
async def get_grandma_report():
    report = get_grandma_report_db()
    if not report:
        return {"success": False, "error": "No report found"}

    return {"success": True, "report": report}


async def generate_save_report(all_texts_concatenated: str):
    try:
        if not all_texts_concatenated.strip():
            print("Warning: No texts to process. Skipping report generation.")
            return
        report = await generate_combined_medical_summary_md(all_texts_concatenated.strip())
        if not report:
            print("Warning: No report generated. Skipping save.")
            return
        report = clean_report(report)
        save_grandma_report(report)
    except Exception as e:
        print(f"Error in generate_save_report: {str(e)}")


def clean_report(report: str) -> str:
    report = report.strip()
    if report.startswith("```markdown"):
        report = report[len("```markdown"):].strip()
    if report.endswith("```"):
        report = report[:-len("```")]
    return report


MODEL = "gpt-4o-mini-realtime-preview"
BASE_URL = "https://api.openai.com/v1/realtime"
# Replace with your actual VOICE config or import it
VOICE = "coral"


@router.get("/realtime/session")
async def get_realtime_session():
    try:
        headers = {
            "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": MODEL,
            "voice": VOICE,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(f"{BASE_URL}/sessions", json=payload, headers=headers)

        return Response(content=response.content, media_type="application/json", status_code=status.HTTP_200_OK)

    except Exception as e:
        print("Error:", str(e))
        return Response(
            content=f'{{"error": "{str(e)}"}}',
            media_type="application/json",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
