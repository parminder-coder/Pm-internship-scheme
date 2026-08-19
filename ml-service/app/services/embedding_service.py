# FastAPI starts
#      ↓
# EmbeddingService()
#      ↓
# Download/load MiniLM
#      ↓
# Keep model in memory
from sentence_transformers import SentenceTransformer


class EmbeddingService:

    def __init__(self):
        print("Loading MiniLM model...")
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        print("MiniLM model loaded.")

    def create_embedding(self, text: str):
        return self.model.encode([text])


embedding_service = EmbeddingService()