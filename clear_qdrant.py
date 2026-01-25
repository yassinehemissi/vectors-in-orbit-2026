from qdrant_client import QdrantClient
from config import Config

q_client = QdrantClient(url=Config.QDRANT_URL)
try:
    q_client.delete_collection(Config.QDRANT_COLLECTION)
    print(f"Deleted collection {Config.QDRANT_COLLECTION}")
except Exception as e:
    print(f"Delete failed: {e}")
