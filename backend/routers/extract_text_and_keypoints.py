import base64
import os
from datetime import datetime
from openai import OpenAI
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv
from pathlib import Path
import asyncio

# Load environment variables from .env file in the project root
# Script directory: Epoch-CDTM-Hacks/backend/routers
# Project root: Epoch-CDTM-Hacks
script_dir = Path(__file__).resolve().parent
project_root = script_dir.parent.parent
dotenv_path = project_root / ".env"
load_dotenv(dotenv_path=dotenv_path)


def encode_image(image_bytes):
    """Encode image bytes to base64 string"""
    return base64.b64encode(image_bytes).decode('utf-8')


async def extract_text_from_image(image_bytes, content_type="image/png"):
    """Extract text from an image using OpenAI's vision model

    Args:
        image_bytes: Binary image data
        content_type: The content type of the image (e.g., "image/png", "image/jpeg")

    Returns:
        str: The extracted text from the image
    """
    try:
        # Initialize OpenAI client
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return "Error: OPENAI_API_KEY environment variable not set."

        client = OpenAI(api_key=api_key)

        # Encode the image
        base64_image = encode_image(image_bytes)

        # Get the image format
        image_format = content_type.split('/')[1]

        # Create the API request
        response = await client.chat.completions.acreate(model="gpt-4o-mini",
                                                         messages=[
                                                             {
                                                                 "role": "user",
                                                                 "content": [
                                                                     {
                                                                         "type": "text",
                                                                         "text": "Extract the text from this image, ensuring all text is captured accurately. Do not include any markdown or code formatting."
                                                                     },
                                                                     {
                                                                         "type": "image_url",
                                                                         "image_url": {
                                                                             "url": f"data:image/{image_format};base64,{base64_image}"
                                                                         },
                                                                     },
                                                                 ],
                                                             }
                                                         ])

        # Extract the response text
        extracted_text = response.choices[0].message.content

        return extracted_text

    except Exception as e:
        return f"Error extracting text: {str(e)}"


async def analyze_document_with_langchain(extracted_text: str, document_type: str = "report"):
    """
    Analyzes extracted text using Langchain to validate document type,
    check recency, and assess clarity.

    Args:
        extracted_text (str): The text extracted from a document.
        document_type (str): The expected type of the document (e.g., "report", "letter").

    Returns:
        tuple: (validation_result, recency_result, clarity_score, llm_instance)
               Returns (error_message, None, None, None) if API key is missing.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "Error: OPENAI_API_KEY environment variable not set.", None, None, None

    today_date = datetime.now().strftime("%Y-%m-%d")
    llm = ChatOpenAI(openai_api_key=api_key, model_name="gpt-4o-mini")

    # 1. Validate Document Type
    prompt_validate_text = """Based on the content of the following text, determine if it is a '{doc_type}'.
Respond with only 'yes' or 'no'.

Text:
{text}"""
    prompt_validate = ChatPromptTemplate.from_template(prompt_validate_text)
    chain_validate = prompt_validate | llm | StrOutputParser()

    # 2. Check Recency (last year)
    prompt_recency_text = """Analyze the following text to determine if the information or events described seem to be from within the last year from today.
Consider any dates, mentions of time periods, or contextual clues.
Respond with only 'recent', 'not recent', or 'unknown'. TODAY'S DATE IS {today_date}.

Text:
{text}"""
    prompt_recency = ChatPromptTemplate.from_template(prompt_recency_text)
    chain_recency = prompt_recency | llm | StrOutputParser()

    # 3. Check Clarity and assign a score
    prompt_clarity_text = """Evaluate the clarity and coherence of the following text, which is an OCR extraction from a document.
Assign a numerical score between 0.0 and 1.0, where 1.0 means the text is perfectly clear, well-structured, and fully understandable,
and 0.0 means the text is completely garbled, nonsensical, or unintelligible.
Consider factors like grammatical correctness, if there are words obviously out of context, completeness of sentences, and overall meaningfulness.
Respond only with the numerical score (x.xx). 

Text:
{text}"""
    prompt_clarity = ChatPromptTemplate.from_template(prompt_clarity_text)
    chain_clarity = prompt_clarity | llm | StrOutputParser()

    # Run the LLM calls in parallel
    results = await asyncio.gather(
        chain_validate.ainvoke(
            {"text": extracted_text, "doc_type": document_type}),
        chain_recency.ainvoke(
            {"text": extracted_text, "today_date": today_date}),
        chain_clarity.ainvoke({"text": extracted_text})
    )
    validation_result, recency_result, clarity_score_str = results

    try:
        clarity_score = float(clarity_score_str)
    except ValueError:
        clarity_score = 0.0
        # print(f"Warning: Could not parse clarity score '{clarity_score_str}' as float.")

    return validation_result, recency_result, clarity_score, llm


async def process_document_acceptance(extracted_text: str, validation_result: str,
                                      recency_result: str | None, clarity_score: float | None,
                                      llm: ChatOpenAI | None, doc_type: str):
    """Processes the analysis, generates error messages.
    If accepted, returns a function to extract keywords on demand.

    Returns:
        dict: Contains 'accepted' (bool), 'error' (str).
              If accepted, also includes 'data' (dict with 'text') and
              'get_keywords' (a callable function to extract keywords).
    """
    if validation_result == "Error: OPENAI_API_KEY environment variable not set." or llm is None:
        return {"accepted": False, "error": "Critical error: OpenAI API key not set or LLM not available."}

    rejection_reasons = []

    if doc_type in {"Insurance Card", "Doctor's Letter", "Lab Report"}:
        # 1. Medical Relevance Check (for these specific types)
        prompt_medical_relevance_text = """Based on the content of the following text, determine if it is medically relevant for the document type '{doc_type_context}'.
        Medically relevant documents include patient records, test results, doctor's notes, insurance information for medical purposes, vaccination records, etc.
        Non-medically relevant documents could be invoices for unrelated services, personal letters without medical content, random articles, etc.
        Respond with only 'yes' or 'no'.

        Text:
        {text}
        Document Type Context: {doc_type_context}"""
        prompt_medical_relevance = ChatPromptTemplate.from_template(
            prompt_medical_relevance_text)
        chain_medical_relevance = prompt_medical_relevance | llm | StrOutputParser()
        medical_relevance_result = await chain_medical_relevance.ainvoke({"text": extracted_text, "doc_type_context": doc_type})

        if medical_relevance_result.lower() != 'yes':
            rejection_reasons.append(
                f"it was determined to be not medically relevant for an '{doc_type}'")

        # 2. Type Check (Content vs. Provided doc_type, for these specific types)
        # validation_result is from analyze_document_with_langchain, checking content against the provided doc_type
        if validation_result.lower() != 'yes':
            rejection_reasons.append(
                f"its content does not seem to match the expected document type: '{doc_type}'")

        # 3. Clarity Check (for these specific types)
        if clarity_score is None:  # Should ideally not happen if no API key error and llm is present
            rejection_reasons.append(
                "the clarity score could not be determined")
        elif clarity_score < 0.5:
            rejection_reasons.append(
                f"its clarity score of {clarity_score:.2f} is below the 0.5 threshold (text may be blurry or hard to read)")
        # Recency is explicitly not checked for these types as per requirements.

    elif doc_type in {"Vaccination Card", "Anything else?"}:
        # For these types, no specific checks within this function lead to rejection.
        # They are considered accepted by default here, bypassing medical relevance, specific type content match, and clarity as rejection criteria.
        # The initial validation_result (type check) from analyze_document_with_langchain is noted but not used for rejection here.
        print("Bypassing checks for these types.")
        pass

    # Note: The original generic recency check is now omitted unless specified for a doc_type.
    # Current requirements do not ask for recency checks for any of the specified doc_types.

    if rejection_reasons:
        reasons_string = ""
        if len(rejection_reasons) == 1:
            reasons_string = rejection_reasons[0]
        elif len(rejection_reasons) == 2:
            reasons_string = f"{rejection_reasons[0]} and {rejection_reasons[1]}"
        else:
            reasons_string = ", ".join(
                rejection_reasons[:-1]) + f", and {rejection_reasons[-1]}"

        error_prompt_template = """A document submitted as '{doc_type_for_user}' could not be accepted due to the following: {reasons}.
Generate a polite, single-sentence message for the user to explain this.
This message should clearly state the main problem(s) and suggest simple corrective actions.
Use simple language suitable for non-technical users. Avoid jargon.

Examples for phrasing suggestions:
- If not medically relevant: "The document doesn't appear to contain medical information. Please upload a relevant medical document."
- If content doesn't match expected type: "The document's content doesn't seem to be a '{doc_type_for_user}'. Please ensure you upload the correct type of document."
- If clarity is low: "The text in the document is blurry or hard to read. Could you please try uploading a clearer photo?"
- If multiple issues: Combine suggestions, e.g., "The document is hard to read and its content doesn't seem to be a '{doc_type_for_user}'. Please upload a clearer photo of the correct document."

Focus on guiding the user to a successful re-upload. Output only the single sentence of the user-facing message.

Document Type user tried to upload: {doc_type_for_user}
Identified issues by the system: {reasons}
"""
        error_prompt = ChatPromptTemplate.from_template(error_prompt_template)
        error_chain = error_prompt | llm | StrOutputParser()
        llm_generated_error = await error_chain.ainvoke({
            "reasons": reasons_string,
            "doc_type_for_user": doc_type  # Pass the actual doc_type for the prompt context
        })
        return {"accepted": False, "error": llm_generated_error.strip()}

    # If all checks pass (i.e., no rejection_reasons were added that apply to this doc_type)
    async def _extract_keywords_on_demand():
        keyword_prompt_text = """From the following text, extract the most significant pieces of information as key-value pairs.
For each piece of information, identify a concise, descriptive label (the key) and its corresponding value from the text.
Examples of potential labels could be 'Patient Name', 'Condition', 'Treatment', 'Finding', 'Recommendation', 'Date', 'Organization', etc., but adapt the labels dynamically based on the text content.
List these key-value pairs as a comma-separated string. For example: 'Patient Name: Jane Doe, Condition: Cardiac Health, Recommendation: Continue treatment'.
Aim for 5-10 distinct and informative key-value pairs.

Text:
{text}"""
        prompt_keywords = ChatPromptTemplate.from_template(keyword_prompt_text)
        chain_keywords = prompt_keywords | llm | StrOutputParser()
        keywords_str = await chain_keywords.ainvoke({"text": extracted_text})
        individual_keywords = [
            keyword.strip() for keyword in keywords_str.split(',') if keyword.strip()]
        if not individual_keywords:
            return ""  # Return an empty string if no keywords are found
        markdown_keywords = "\n".join(
            [f"- {kw}" for kw in individual_keywords])
        return markdown_keywords

    success_message = ""
    if doc_type in ["Insurance Card", "Doctor's Letter", "Lab Report"]:
        # Construct detailed success message for types that underwent full checks
        success_details = []
        # We assume if it reached here without rejection_reasons, the performed checks passed.
        success_details.append("medically relevant")
        success_details.append(f"type confirmed as '{doc_type}'")
        if clarity_score is not None:
            success_details.append(
                f"clarity is sufficient (score: {clarity_score:.2f})")
        success_message = f"Document accepted: {', '.join(success_details)}."
    elif doc_type in ["Vaccination Card", "Anything else?"]:
        # Simpler success message for types with fewer checks
        success_message = f"Document accepted as '{doc_type}'. This document type bypasses detailed content checks."
    else:
        # Fallback, though theoretically unreachable if doc_type is always one of the validated ones
        success_message = f"Document '{doc_type}' accepted."

    return {
        "accepted": True,
        "error": success_message,  # 'error' field also used for the success message
        "data": {
            "text": extracted_text,
        },
        "get_keywords": _extract_keywords_on_demand
    }


# Example usage (you can uncomment and run this file directly):
if __name__ == "__main__":
    import json

    # --- Example 1: Potentially good document ---
    sample_text_report = """
    Patient Name: Jane Doe
    Date of Report: March 2, 2025 
    This is a sample medical report discussing recent findings related to cardiac health and cholesterol levels.
    The patient's condition has shown improvement over the last two months following new medication.
    Findings: Generally normal, consistent with recovery. Echocardiogram shows good ventricular function.
    Recommendations: Continue current treatment for hypertension. Follow up in 1 month for blood pressure check.
    Doctor: Dr. Smith, General Hospital Cardiology Department.
    """
    sample_document_type = "report"

    print(f"Analyzing sample text 1 (type: {sample_document_type})...")
    val_res, rec_res, clar_score, llm_instance = analyze_document_with_langchain(
        sample_text_report, sample_document_type)
    print(
        f"LLM Analysis Results: Validation='{val_res}', Recency='{rec_res}', Clarity={clar_score}")

    acceptance_output = {}
    if llm_instance:
        acceptance_output = process_document_acceptance(
            sample_text_report, val_res, rec_res, clar_score, llm_instance, sample_document_type)
        print("Acceptance Decision (Sample 1):")

        if acceptance_output.get("accepted"):
            print(f"  Accepted: True")
            print(f"  Message: {acceptance_output.get('error')}")
            print(
                f"  Text available in data: {bool(acceptance_output.get('data', {}).get('text'))}")

            # Demonstrate calling the returned function for keywords
            get_keywords_func = acceptance_output.get("get_keywords")
            if callable(get_keywords_func):
                print("  Attempting to extract keywords on demand...")
                keywords = get_keywords_func()
                print(f"  Extracted Keywords: {keywords}")
            else:
                print("  get_keywords function not available or not callable.")
        else:
            # For rejected documents, print the full JSON as it includes the error message
            print(json.dumps(acceptance_output, indent=2))

    else:
        # Handle API key error from analyze_document_with_langchain
        print(f"Skipping acceptance processing due to error: {val_res}")
        # Simulate a similar structure for consistency in testing if needed, though no keywords func here
        acceptance_output = {"accepted": False, "error": val_res}

    print("\n" + "-"*50 + "\n")

    # --- Example 2: Low clarity document & wrong type (let's say we expect "letter") ---
    sample_text_blurry_wrong_type = "Ths is a vry hrd to read txt wth mny typos adincmplete wrds. It dsn\'t mak sens. Mentions invoice for payment."
    sample_document_type_2 = "letter"

    print(
        f"Analyzing sample text 2 (blurry, actual type potentially invoice, expected: {sample_document_type_2})...")
    val_res_b, rec_res_b, clar_score_b, llm_instance_b = analyze_document_with_langchain(
        sample_text_blurry_wrong_type, sample_document_type_2)
    print(
        f"LLM Analysis Results: Validation='{val_res_b}', Recency='{rec_res_b}', Clarity={clar_score_b}")

    if llm_instance_b:
        acceptance_output_b = process_document_acceptance(
            sample_text_blurry_wrong_type, val_res_b, rec_res_b, clar_score_b, llm_instance_b, sample_document_type_2)
        print("Acceptance Decision (Sample 2 - blurry & wrong type):")
        # Rejected, so get_keywords won't be present
        print(json.dumps(acceptance_output_b, indent=2))
    else:
        print(f"Skipping acceptance processing due to error: {val_res_b}")

    print("\n" + "-"*50 + "\n")

    # --- Example 3: Old document, but good clarity and type ---
    sample_text_old = """
    Medical History Summary for John Smith
    Date of Record: March 10, 2021
    This document outlines the patient's medical history prior to 2022, focusing on respiratory conditions.
    All information is clear and well-structured.
    No updates since that time. Primary physician: Dr. Emily White.
    Previous diagnosis: Chronic Asthma.
    """
    sample_document_type_3 = "report"

    print(f"Analyzing sample text 3 (old, type: {sample_document_type_3})...")
    val_res_o, rec_res_o, clar_score_o, llm_instance_o = analyze_document_with_langchain(
        sample_text_old, sample_document_type_3)
    print(
        f"LLM Analysis Results: Validation='{val_res_o}', Recency='{rec_res_o}', Clarity={clar_score_o}")

    if llm_instance_o:
        acceptance_output_o = process_document_acceptance(
            sample_text_old, val_res_o, rec_res_o, clar_score_o, llm_instance_o, sample_document_type_3)
        print("Acceptance Decision (Sample 3 - old text):")
        # Rejected, so get_keywords won't be present
        print(json.dumps(acceptance_output_o, indent=2))
    else:
        print(f"Skipping acceptance processing due to error: {val_res_o}")
