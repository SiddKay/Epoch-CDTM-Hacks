from fastapi import FastAPI
from routers.process_image import router as process_image_router

app = FastAPI()

app.include_router(process_image_router)

# Routers will be included here 