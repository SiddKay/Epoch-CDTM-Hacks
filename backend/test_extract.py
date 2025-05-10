import os
import asyncio
import sys
from pathlib import Path
import base64
from routers.extract_text_and_keypoints import extract_text_from_image

# Set your OpenAI API key here or as an environment variable
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get OpenAI API key from environment variables
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    print("Warning: OPENAI_API_KEY not found in .env file")

def read_image(image_path):
    """Read image file and return bytes"""
    if not Path(image_path).exists():
        return None, f"Error: Image file {image_path} not found."
    
    with open(image_path, "rb") as image_file:
        return image_file.read(), None

async def main():
    # Path to the test image
    image_path = "test.png"
    
    # Read the image
    image_bytes, error = read_image(image_path)
    if error:
        print(error)
        return
    
    # Get image format
    image_format = f"image/{image_path.split('.')[-1].lower()}"
    
    # Extract text from the image
    result = extract_text_from_image(image_bytes, image_format)
    
    print(f"Extracted Text:\n{result}")

if __name__ == "__main__":
    asyncio.run(main()) 