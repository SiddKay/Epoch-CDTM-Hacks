# Backend for Patient Document

This backend is built with FastAPI and provides an endpoint to upload images, extract text and key points, and save them to Supabase.

## Setup

1. Create environment
   ```bash
   python3.11 -m venv venv
   ```

2. Activate environment
   ```bash
   source venv/bin/activate
   ```

3. Install requirements
   ```bash
   pip install -r requirements.txt
   ```

4. Run the app
   ```bash
   uvicorn main:app --reload
   ```

## Endpoint

- `POST /upload-image`: Upload an image file. Returns extracted text and key points. 