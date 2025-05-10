from fastapi import FastAPI
from routers.process_image import router as process_image_router
from routers.chat_speak import chat_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Routers will be included here
app.include_router(process_image_router)
app.include_router(chat_router)
