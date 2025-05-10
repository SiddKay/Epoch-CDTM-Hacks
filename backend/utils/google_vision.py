from dotenv import load_dotenv
from openai import OpenAI
import os
import base64
from google.cloud import vision
from google.oauth2 import service_account
import time

load_dotenv()

# Load your service account key
if os.getenv("PRODUCTION"):
    credentials = service_account.Credentials.from_service_account_file(
        "google-key.json")
    client = vision.ImageAnnotatorClient(credentials=credentials)
else:
    credentials = None
    client = vision.ImageAnnotatorClient()


def extract_text_from_image_using_google(content: bytes):
    """
    Extract text from an image using Google Vision.
    """
    start = time.time()
    image = vision.Image(content=content)
    response = client.text_detection(image=image)
    text = response.full_text_annotation.text
    end = time.time()
    result_google = end - start
    print(f"Text extraction via Google Vision: {result_google} seconds")
    return text
