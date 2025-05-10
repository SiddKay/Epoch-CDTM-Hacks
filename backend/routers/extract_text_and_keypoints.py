import base64
import os
from datetime import datetime
from openai import OpenAI
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv
from pathlib import Path

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

def extract_text_from_image(image_bytes, content_type="image/png"):
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
        response = client.chat.completions.create(model="gpt-4o-mini",
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

def analyze_document_with_langchain(extracted_text: str, document_type: str = "report"):
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
    validation_result = chain_validate.invoke({"text": extracted_text, "doc_type": document_type})

    # 2. Check Recency (last 3 months)
    prompt_recency_text = """Analyze the following text to determine if the information or events described seem to be from within the last 3 months from today.
Consider any dates, mentions of time periods, or contextual clues.
Respond with only 'recent', 'not recent', or 'unknown'. TODAY'S DATE IS {today_date}.

Text:
{text}"""
    prompt_recency = ChatPromptTemplate.from_template(prompt_recency_text)
    chain_recency = prompt_recency | llm | StrOutputParser()
    recency_result = chain_recency.invoke({"text": extracted_text, "today_date": today_date})

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
    clarity_score_str = chain_clarity.invoke({"text": extracted_text})

    try:
        clarity_score = float(clarity_score_str)
    except ValueError:
        clarity_score = 0.0
        # print(f"Warning: Could not parse clarity score '{clarity_score_str}' as float.")

    return validation_result, recency_result, clarity_score, llm

def process_document_acceptance(extracted_text: str, validation_result: str, 
                                recency_result: str | None, clarity_score: float | None, 
                                llm: ChatOpenAI | None):
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
    
    if validation_result.lower() != 'yes':
        rejection_reasons.append("its type could not be confirmed as the expected document type")
    
    if recency_result and recency_result.lower() == 'not recent':
        rejection_reasons.append("it was determined to be not recent (older than the last 3 months)")
    
    if clarity_score is None: # Should ideally not happen if no API key error and llm is present
        rejection_reasons.append("the clarity score could not be determined")
    elif clarity_score < 0.5:
        rejection_reasons.append(f"its clarity score of {clarity_score:.2f} is below the 0.5 threshold")

    if rejection_reasons:
        reasons_string = ""
        if len(rejection_reasons) == 1:
            reasons_string = rejection_reasons[0]
        elif len(rejection_reasons) == 2:
            reasons_string = f"{rejection_reasons[0]} and {rejection_reasons[1]}"
        else: # 3 or more reasons (though current logic maxes at 3 distinct types)
            reasons_string = ", ".join(rejection_reasons[:-1]) + f", and {rejection_reasons[-1]}"

        error_prompt_template = """A document was rejected due to the following issues: {reasons}.
Generate a polite, single-sentence message for the user. This message should clearly state the main problem(s) and suggest a corrective action.
For example:
- If the type is wrong or unconfirmed, suggest uploading the correct document type or a clearer image.
- If the document is not recent, suggest uploading a newer one (from the last 3 months).
- If clarity is low, suggest re-uploading a clearer, more legible photo.
Combine these suggestions logically if there are multiple issues. Focus on guiding the user to a successful re-upload. Output only the single sentence."""
        error_prompt = ChatPromptTemplate.from_template(error_prompt_template)
        error_chain = error_prompt | llm | StrOutputParser()
        llm_generated_error = error_chain.invoke({"reasons": reasons_string})
        return {"accepted": False, "error": llm_generated_error.strip()}
        
    # If all checks pass, define a function to get keywords on demand
    def _extract_keywords_on_demand():
        keyword_prompt_text = """From the following text, extract the most significant pieces of information as key-value pairs.
For each piece of information, identify a concise, descriptive label (the key) and its corresponding value from the text.
Examples of potential labels could be 'Patient Name', 'Condition', 'Treatment', 'Finding', 'Recommendation', 'Date', 'Organization', etc., but adapt the labels dynamically based on the text content.
List these key-value pairs as a comma-separated string. For example: 'Patient Name: Jane Doe, Condition: Cardiac Health, Recommendation: Continue treatment'.
Aim for 5-10 distinct and informative key-value pairs.

Text:
{text}"""
        prompt_keywords = ChatPromptTemplate.from_template(keyword_prompt_text)
        chain_keywords = prompt_keywords | llm | StrOutputParser()
        keywords_str = chain_keywords.invoke({"text": extracted_text})
        individual_keywords = [keyword.strip() for keyword in keywords_str.split(',') if keyword.strip()]
        if not individual_keywords:
            return "" # Return an empty string if no keywords are found
        markdown_keywords = "\n".join([f"- {kw}" for kw in individual_keywords])
        return markdown_keywords

    success_message = f"Document accepted: Type correct, recency acceptable, and clarity sufficient (score: {clarity_score:.2f})."
    return {
        "accepted": True, 
        "error": success_message, 
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
    val_res, rec_res, clar_score, llm_instance = analyze_document_with_langchain(sample_text_report, sample_document_type)
    print(f"LLM Analysis Results: Validation='{val_res}', Recency='{rec_res}', Clarity={clar_score}")
    
    acceptance_output = {}
    if llm_instance: 
        acceptance_output = process_document_acceptance(sample_text_report, val_res, rec_res, clar_score, llm_instance)
        print("Acceptance Decision (Sample 1):")
        
        if acceptance_output.get("accepted"):
            print(f"  Accepted: True")
            print(f"  Message: {acceptance_output.get('error')}")
            print(f"  Text available in data: {bool(acceptance_output.get('data', {}).get('text'))}")
            
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

    print(f"Analyzing sample text 2 (blurry, actual type potentially invoice, expected: {sample_document_type_2})...")
    val_res_b, rec_res_b, clar_score_b, llm_instance_b = analyze_document_with_langchain(sample_text_blurry_wrong_type, sample_document_type_2)
    print(f"LLM Analysis Results: Validation='{val_res_b}', Recency='{rec_res_b}', Clarity={clar_score_b}")

    if llm_instance_b:
        acceptance_output_b = process_document_acceptance(sample_text_blurry_wrong_type, val_res_b, rec_res_b, clar_score_b, llm_instance_b)
        print("Acceptance Decision (Sample 2 - blurry & wrong type):")
        print(json.dumps(acceptance_output_b, indent=2)) # Rejected, so get_keywords won't be present
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
    val_res_o, rec_res_o, clar_score_o, llm_instance_o = analyze_document_with_langchain(sample_text_old, sample_document_type_3)
    print(f"LLM Analysis Results: Validation='{val_res_o}', Recency='{rec_res_o}', Clarity={clar_score_o}")

    if llm_instance_o:
        acceptance_output_o = process_document_acceptance(sample_text_old, val_res_o, rec_res_o, clar_score_o, llm_instance_o)
        print("Acceptance Decision (Sample 3 - old text):")
        print(json.dumps(acceptance_output_o, indent=2)) # Rejected, so get_keywords won't be present
    else:
        print(f"Skipping acceptance processing due to error: {val_res_o}")

# print(analyze_document_with_langchain(extracted_text)) # Old example call