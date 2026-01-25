"""Configuration management for the scientific paper processing pipeline."""
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Centralized configuration for the pipeline."""
    
    # GROBID Configuration
    GROBID_URL: str = os.getenv("GROBID_URL", "http://localhost:8070")
    GROBID_TIMEOUT: int = int(os.getenv("GROBID_TIMEOUT", "120"))
    
    # Qdrant Configuration
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    QDRANT_COLLECTION: str = os.getenv("QDRANT_COLLECTION", "experiments")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    
    # ScyllaDB Configuration
    SCYLLADB_HOSTS: list = os.getenv("SCYLLADB_HOSTS", "127.0.0.1").split(",")
    SCYLLADB_KEYSPACE: str = os.getenv("SCYLLADB_KEYSPACE", "scientific_papers")
    SCYLLADB_PORT: int = int(os.getenv("SCYLLADB_PORT", "9042"))
    
    # Model Configuration
    SUMMARIZATION_MODEL: str = os.getenv("SUMMARIZATION_MODEL", "facebook/bart-large-cnn")
    EXTRACTION_MODEL: str = os.getenv("EXTRACTION_MODEL", "mistralai/Mistral-7B-Instruct-v0.2")
    DEVICE: str = os.getenv("DEVICE", "cuda" if os.getenv("CUDA_AVAILABLE") == "true" else "cpu")
    
    # API-based LLM Configuration (for summarization)
    USE_API_SUMMARIZATION: bool = os.getenv("USE_API_SUMMARIZATION", "false").lower() == "true"
    SUMMARIZATION_API_PROVIDER: str = os.getenv("SUMMARIZATION_API_PROVIDER", "openai")  # openai, anthropic, together, etc.
    SUMMARIZATION_API_KEY: Optional[str] = os.getenv("SUMMARIZATION_API_KEY")
    SUMMARIZATION_API_MODEL: str = os.getenv("SUMMARIZATION_API_MODEL", "gpt-3.5-turbo")  # gpt-3.5-turbo, gpt-4, claude-3-haiku, etc.
    SUMMARIZATION_API_BASE_URL: Optional[str] = os.getenv("SUMMARIZATION_API_BASE_URL")  # For custom endpoints
    
    # Processing Configuration
    MAX_BLOCK_SIZE: int = int(os.getenv("MAX_BLOCK_SIZE", "1000"))
    MIN_BLOCK_SIZE: int = int(os.getenv("MIN_BLOCK_SIZE", "50"))
    BATCH_SIZE: int = int(os.getenv("BATCH_SIZE", "8"))
    
    # Output Configuration
    OUTPUT_DIR: Path = Path(os.getenv("OUTPUT_DIR", "./output"))
    
    @classmethod
    def ensure_output_dir(cls):
        """Ensure output directory exists."""
        cls.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


