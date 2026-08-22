import os
import logging
import warnings

# Suppress Hugging Face Hub unauthenticated rate-limit warnings
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)
logging.getLogger("huggingface_hub").setLevel(logging.ERROR)
warnings.filterwarnings("ignore")

from sentence_transformers import SentenceTransformer


class EmbeddingService:

    def __init__(self):
        print("Loading MiniLM model...")
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        print("MiniLM model loaded.")

    def create_embedding(self, text: str):
        return self.model.encode([text])


embedding_service = EmbeddingService()