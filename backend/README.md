# Backend for Patient Document

This backend is built with FastAPI and provides an endpoint to upload images, extract text and key points, and save them to Supabase.

## Setup
1. Add an `.env` file to the repository root and set up your secret variables as shown in `/.env.example`. This should include your OpenAI API key and Supabase credentials.
2. Add your Google Cloud service account key JSON file to the backend's root directory as `google-key.json`. This is required for the OCR functionality.
3. Create environment
   ```bash
   python3.11 -m venv venv
   ```
4. Activate environment
   ```bash
   source venv/bin/activate
   ```
5. Install requirements
   ```bash
   pip install -r requirements.txt
   ```
6. Run the app
   ```bash
   uvicorn main:app --reload
   ```