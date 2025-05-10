from dotenv import load_dotenv
from openai import OpenAI
import os
import base64
from google.cloud import vision
from google.oauth2 import service_account
import time
# Load your service account key
credentials = service_account.Credentials.from_service_account_file(
    "notebooks/google-key.json")

client = vision.ImageAnnotatorClient(credentials=credentials)

# Load image
with open("test.png", "rb") as image_file:
    content = image_file.read()

print("Starting OCR")
start = time.time()
image = vision.Image(content=content)

# Perform OCR
response = client.text_detection(image=image)
text = response.full_text_annotation.text
print("OCR complete")
end = time.time()
result_google = end - start
print(f"Time taken: {result_google} seconds")

# Now let's try with OpenAI

# Load environment variables
load_dotenv()


def encode_image(image_bytes):
    """Encode image bytes to base64 string"""
    return base64.b64encode(image_bytes).decode('utf-8')


def extract_text_from_image(image_bytes, content_type="image/png"):
    """Extract text from an image using OpenAI's vision model"""
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
        print("Starting OpenAI OCR")
        start_openai = time.time()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
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
            ]
        )

        # Extract the response text
        extracted_text = response.choices[0].message.content
        end_openai = time.time()
        result_openai = end_openai - start_openai
        print("OpenAI OCR complete")
        print(f"Time taken with OpenAI: {result_openai} seconds")
        print("\nOpenAI extracted text:")
        print(extracted_text)

        return extracted_text, result_openai

    except Exception as e:
        return f"Error extracting text: {str(e)}", 0


# Run OpenAI extraction with the same image
with open("test.png", "rb") as image_file:
    content = image_file.read()

openai_text, openai_time = extract_text_from_image(content, "image/png")

# Compare results
print("\nComparison:")
print(f"Google OCR time: {result_google} seconds")
print(f"OpenAI OCR time: {openai_time} seconds")
print(f"Time difference: {abs(result_google - openai_time)} seconds")

print("\nOpenAI extracted text:")
print(openai_text)

print("\n--------------------------------\n")

print("\nGoogle OCR text:")
print(text)
