from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.routers import upload, videos, transcript, chat, quiz

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="Video Learn API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="frontend"), name="static")

app.include_router(upload.router,     prefix="/api")
app.include_router(videos.router,     prefix="/api")
app.include_router(transcript.router, prefix="/api")
app.include_router(chat.router,       prefix="/api")
app.include_router(quiz.router,       prefix="/api")

@app.get("/")
async def root():
    return {"message": "Video Learn API is running"}