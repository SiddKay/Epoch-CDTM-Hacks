import os
import time

from dotenv import load_dotenv
from google.cloud import vision
from google.oauth2 import service_account

load_dotenv(override=True)

if int(os.getenv("PRODUCTION", "0")):
    # Load your service account key from environment variable
    credentials = None
    client = vision.ImageAnnotatorClient()
else:
    # Load your service account key locally
    credentials = service_account.Credentials.from_service_account_file(
        "google-key.json")
    client = vision.ImageAnnotatorClient(credentials=credentials)


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
