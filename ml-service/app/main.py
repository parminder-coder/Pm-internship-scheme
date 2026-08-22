import os
import logging
import warnings

# Suppress Hugging Face Hub warnings before any transformers import
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN_WARNING"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
warnings.filterwarnings("ignore")
logging.getLogger("huggingface_hub").setLevel(logging.ERROR)
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.recommendation import router as recommendation_router
from app.routes.resume import router as resume_router


app = FastAPI(
    title="Internship Recommendation ML Service"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    recommendation_router,
    prefix="/api"
)

app.include_router(
    resume_router,
    prefix="/api"
)

@app.get("/")
def root():
    return {
        "message": "ML service is running"
    }