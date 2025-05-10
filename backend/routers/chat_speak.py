# main.py or routes/chat.py
from termios import ECHOPRT
from fastapi import FastAPI, Request, APIRouter
from pydantic import BaseModel
import httpx
import os
from fastapi.responses import StreamingResponse
import httpx
from io import BytesIO
from routers.process_image import get_all_image_data_for_reprocessing
from fastapi.responses import JSONResponse
from database.supabase_client import get_grandma_report_db

chat_router = APIRouter()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


class ChatRequest(BaseModel):
    userText: str


@chat_router.post("/chat")
async def chat(request: ChatRequest):
    system_prompt = await get_system_prompt()

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.userText}
                ]
            }
        )
    data = response.json()
    reply = data["choices"][0]["message"]["content"]
    return {"reply": reply}


class SpeakRequest(BaseModel):
    text: str


@chat_router.post("/speak")
async def speak(request: SpeakRequest):
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/audio/speech",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "tts-1",
                "input": request.text,
                "voice": "nova",  # or alloy, fable, echo, shimmer, onyx
            },
        )
    audio_data = BytesIO(response.content)
    return StreamingResponse(audio_data, media_type="audio/mpeg")


@chat_router.get("/session")
async def get_ephemeral_session():
    system_prompt = await get_system_prompt()

    url = "https://api.openai.com/v1/realtime/sessions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": "gpt-4o-realtime-preview-2024-12-17",
        "voice": "sage",
        "instructions": system_prompt
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=body)
        data = response.json()

    return JSONResponse(content=data)


async def get_system_prompt():
    report = get_grandma_report_db()

    if not report:
        report = "No information available"

    return f"""You are a helpful assistant that speaks clearly and very concisely.
You are given a report of a patient's medical history.
The report is as follows:
---
{report}
---

You are given a question from the doctor. Please answer the question based on the report.
When doing so, always mention the sections of the report that you are basing your answer on by their section titles!
Double check your answer against the report!
Please be concise, to the point, and talk quickly.
"""
