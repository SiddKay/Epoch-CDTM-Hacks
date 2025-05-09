# Backend for Patient Document

This backend is built with FastAPI and provides an endpoint to upload images, extract text and key points, and save them to Supabase.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## Endpoint

- `POST /upload-image`: Upload an image file. Returns extracted text and key points. 