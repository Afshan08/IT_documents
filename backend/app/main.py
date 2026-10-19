from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.database import Base, engine
import app.models  # Ensures models are registered with Base metadata


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables automatically if they don't exist
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: Database connection/table creation skipped or failed on startup: {e}")
    yield


app = FastAPI(
    title="FastAPI Full-Stack Service",
    version="0.1.0",
    description="Authentication and API service",
    lifespan=lifespan,
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 endpoints
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"message": "FastAPI backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
