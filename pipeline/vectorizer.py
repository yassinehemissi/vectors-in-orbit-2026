"""Vectorization & Storage - Qdrant and ScyllaDB integration."""
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from cassandra.cluster import Cluster
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional
import logging
import uuid
from datetime import datetime
from config import Config
from pipeline.experiment_extractor import ExperimentUnit

logger = logging.getLogger(__name__)


class Vectorizer:
    """Handles vectorization and Qdrant storage."""
    
    def __init__(self, qdrant_url: str = None, embedding_model: str = None):
        self.qdrant_url = qdrant_url or Config.QDRANT_URL
        self.embedding_model_name = embedding_model or Config.EMBEDDING_MODEL
        self.collection_name = Config.QDRANT_COLLECTION
        
        self.client = QdrantClient(url=self.qdrant_url)
        self.embedder = SentenceTransformer(self.embedding_model_name)
        
        self._ensure_collection()
    
    def _ensure_collection(self):
        """Ensure Qdrant collection exists."""
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if self.collection_name not in collection_names:
                logger.info(f"Creating Qdrant collection: {self.collection_name}")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.embedder.get_sentence_embedding_dimension(),
                        distance=Distance.COSINE
                    )
                )
        except Exception as e:
            logger.error(f"Failed to ensure collection: {e}")
    
    def vectorize_experiment(self, experiment: ExperimentUnit) -> List[float]:
        """Create vector embedding for an experiment."""
        # Create text representation for embedding
        text_parts = []
        
        if experiment.protein_or_target:
            text_parts.append(f"Target: {experiment.protein_or_target}")
        if experiment.experiment_type:
            text_parts.append(f"Type: {experiment.experiment_type}")
        if experiment.methodology:
            text_parts.append(f"Method: {experiment.methodology}")
        if experiment.results:
            text_parts.append(f"Results: {experiment.results}")
        
        text = ' '.join(text_parts)
        
        # Generate embedding
        embedding = self.embedder.encode(text, convert_to_numpy=True).tolist()
        return embedding
    
    def store_experiment(self, experiment: ExperimentUnit, paper_id: str) -> str:
        """
        Store experiment in Qdrant.
        
        Returns:
            Experiment ID
        """
        experiment_id = str(uuid.uuid4())
        vector = self.vectorize_experiment(experiment)
        
        # Create payload with structured metadata
        payload = {
            "experiment_id": experiment.experiment_id,
            "paper_id": paper_id,
            "protein_or_target": experiment.protein_or_target,
            "experiment_type": experiment.experiment_type,
            "methodology": experiment.methodology,
            "conditions": experiment.conditions,
            "confidence": experiment.overall_confidence,
            "section_context": experiment.section_context,
            "block_id": experiment.block_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Store in Qdrant
        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                PointStruct(
                    id=experiment_id,
                    vector=vector,
                    payload=payload
                )
            ]
        )
        
        logger.debug(f"Stored experiment {experiment_id} in Qdrant")
        return experiment_id
    
    def search_similar(self, query_experiment: ExperimentUnit, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for similar experiments."""
        query_vector = self.vectorize_experiment(query_experiment)
        
        results = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=limit
        )
        
        return [
            {
                "experiment_id": result.id,
                "score": result.score,
                "payload": result.payload
            }
            for result in results.points
        ]

    def search_by_text(self, query_text: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for experiments using a natural language query."""
        query_vector = self.embedder.encode(query_text, convert_to_numpy=True).tolist()
        
        results = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=limit
        )
        
        return [
            {
                "experiment_id": result.id,
                "score": result.score,
                "payload": result.payload
            }
            for result in results.points
        ]



class Storage:
    """Handles persistent structured storage in ScyllaDB."""
    
    def __init__(self, hosts: List[str] = None, keyspace: str = None):
        self.hosts = hosts or Config.SCYLLADB_HOSTS
        self.keyspace = keyspace or Config.SCYLLADB_KEYSPACE
        self.port = Config.SCYLLADB_PORT
        
        self.cluster = None
        self.session = None
        self._connect()
        self._setup_schema()
    
    def _connect(self):
        """Connect to ScyllaDB cluster."""
        try:
            logger.info(f"Connecting to ScyllaDB at {self.hosts}")
            self.cluster = Cluster(self.hosts, port=self.port)
            self.session = self.cluster.connect()
            logger.info("Connected to ScyllaDB")
        except Exception as e:
            logger.error(f"Failed to connect to ScyllaDB: {e}")
            raise
    
    def _setup_schema(self):
        """Set up database schema."""
        try:
            # Create keyspace if not exists
            self.session.execute(f"""
                CREATE KEYSPACE IF NOT EXISTS {self.keyspace}
                WITH REPLICATION = {{'class': 'SimpleStrategy', 'replication_factor': 1}}
            """)
            
            self.session.set_keyspace(self.keyspace)
            
            # Create experiments table
            self.session.execute("""
                CREATE TABLE IF NOT EXISTS scientific_experiments (
                    experiment_id TEXT PRIMARY KEY,
                    paper_id TEXT,
                    protein_or_target TEXT,
                    experiment_type TEXT,
                    methodology TEXT,
                    conditions MAP<TEXT, TEXT>,
                    measurements TEXT,
                    results TEXT,
                    missing_parameters LIST<TEXT>,
                    inferred_parameters TEXT,
                    overall_confidence FLOAT,
                    section_context TEXT,
                    block_id TEXT,
                    created_at TIMESTAMP
                )
            """)
            
            # Create indexes separately
            self.session.execute(f"CREATE INDEX IF NOT EXISTS exp_paper_idx ON scientific_experiments (paper_id)")
            self.session.execute(f"CREATE INDEX IF NOT EXISTS exp_target_idx ON scientific_experiments (protein_or_target)")
            self.session.execute(f"CREATE INDEX IF NOT EXISTS exp_method_idx ON scientific_experiments (methodology)")
            self.session.execute(f"CREATE INDEX IF NOT EXISTS exp_results_idx ON scientific_experiments (results)")
            
            # Create paper_metadata table
            self.session.execute("""
                CREATE TABLE IF NOT EXISTS paper_metadata (
                    paper_id TEXT PRIMARY KEY,
                    title TEXT,
                    abstract TEXT,
                    file_path TEXT,
                    block_count INT,
                    experiment_count INT,
                    created_at TIMESTAMP
                )
            """)
            
            logger.info("ScyllaDB schema set up successfully")
        except Exception as e:
            logger.error(f"Failed to set up schema: {e}")
    
    def store_experiment(self, experiment: ExperimentUnit, paper_id: str, experiment_id: str):
        """Store experiment in ScyllaDB."""
        try:
            # Convert conditions dict to map
            conditions_map = {}
            if experiment.conditions:
                conditions_map = {str(k): str(v) for k, v in experiment.conditions.items()}
            
            # Serialize inferred_parameters as JSON string
            inferred_json = json.dumps(experiment.inferred_parameters)
            
            self.session.execute("""
                INSERT INTO scientific_experiments (
                    experiment_id, paper_id, protein_or_target, experiment_type,
                    methodology, conditions, measurements, results,
                    missing_parameters, inferred_parameters, overall_confidence,
                    section_context, block_id, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                experiment_id,
                paper_id,
                experiment.protein_or_target,
                experiment.experiment_type,
                experiment.methodology,
                conditions_map,
                experiment.measurements,
                experiment.results,
                experiment.missing_parameters or [],
                inferred_json,
                float(experiment.overall_confidence),
                experiment.section_context,
                experiment.block_id,
                datetime.utcnow()
            ))
            
            logger.debug(f"Stored experiment {experiment_id} in ScyllaDB")
        except Exception as e:
            logger.error(f"Failed to store experiment in ScyllaDB: {e}", exc_info=True)
    
    def store_paper_metadata(self, paper_id: str, title: str, abstract: str, 
                            file_path: str, block_count: int, experiment_count: int):
        """Store paper metadata."""
        try:
            self.session.execute("""
                INSERT INTO paper_metadata (
                    paper_id, title, abstract, file_path, created_at,
                    block_count, experiment_count
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                paper_id,
                title,
                abstract,
                file_path,
                datetime.utcnow(),
                block_count,
                experiment_count
            ))
            
            logger.debug(f"Stored paper metadata for {paper_id}")
        except Exception as e:
            logger.error(f"Failed to store paper metadata: {e}")
    
    def get_experiments_by_paper(self, paper_id: str) -> List[Dict[str, Any]]:
        """Retrieve all experiments for a paper."""
        try:
            rows = self.session.execute(
                "SELECT * FROM scientific_experiments WHERE paper_id = %s",
                (paper_id,)
            )
            
            experiments = []
            for row in rows:
                experiments.append({
                    "experiment_id": row.experiment_id,
                    "paper_id": row.paper_id,
                    "protein_or_target": row.protein_or_target,
                    "experiment_type": row.experiment_type,
                    "methodology": row.methodology,
                    "conditions": dict(row.conditions) if row.conditions else {},
                    "measurements": row.measurements,
                    "results": row.results,
                    "missing_parameters": list(row.missing_parameters) if row.missing_parameters else [],
                    "inferred_parameters": json.loads(row.inferred_parameters) if row.inferred_parameters else [],
                    "overall_confidence": row.overall_confidence,
                    "section_context": row.section_context,
                    "block_id": row.block_id
                })
            
            return experiments
        except Exception as e:
            logger.error(f"Failed to retrieve experiments: {e}")
            return []

    def search_by_keyword(self, keyword: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Fallback keyword search using ScyllaDB indexes."""
        try:
            experiments = []
            # Normalize for manual index matching
            search_terms = [keyword.strip(), keyword.capitalize(), keyword.lower(), keyword.upper()]
            
            for term in set(search_terms):
                # 1. Search by Target
                rows = self.session.execute(
                    "SELECT experiment_id FROM scientific_experiments WHERE protein_or_target = %s ALLOW FILTERING",
                    (term,)
                )
                for row in rows:
                    if not any(e['experiment_id'] == row.experiment_id for e in experiments):
                        experiments.append({"experiment_id": row.experiment_id, "score": 1.0})
                    
                # 2. Search by Methodology
                if len(experiments) < limit:
                    rows = self.session.execute(
                        "SELECT experiment_id FROM scientific_experiments WHERE methodology = %s ALLOW FILTERING",
                        (term,)
                    )
                    for row in rows:
                        if not any(e['experiment_id'] == row.experiment_id for e in experiments):
                            experiments.append({"experiment_id": row.experiment_id, "score": 0.9})
                
                # 3. Search by Results (Partial/Word match simulation)
                if len(experiments) < limit:
                    # In ScyllaDB we can't do full text easily, but we can try exact match for common keywords
                    rows = self.session.execute(
                        "SELECT experiment_id FROM scientific_experiments WHERE results = %s ALLOW FILTERING",
                        (term,)
                    )
                    for row in rows:
                        if not any(e['experiment_id'] == row.experiment_id for e in experiments):
                            experiments.append({"experiment_id": row.experiment_id, "score": 0.8})
            
            return experiments[:limit]
        except Exception as e:
            logger.error(f"Keyword search failed: {e}")
            return []

    def get_experiment_by_id(self, experiment_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single experiment by ID."""
        try:
            rows = self.session.execute(
                "SELECT * FROM scientific_experiments WHERE experiment_id = %s",
                (experiment_id,)
            )
            if not rows: return None
            row = rows[0]
            
            return {
                "experiment_id": row.experiment_id,
                "paper_id": row.paper_id,
                "protein_or_target": row.protein_or_target,
                "experiment_type": row.experiment_type,
                "methodology": row.methodology,
                "conditions": dict(row.conditions) if row.conditions else {},
                "measurements": row.measurements,
                "results": row.results,
                "missing_parameters": list(row.missing_parameters) if row.missing_parameters else [],
                "inferred_parameters": json.loads(row.inferred_parameters) if row.inferred_parameters else [],
                "overall_confidence": row.overall_confidence,
                "section_context": row.section_context,
                "block_id": row.block_id
            }
        except Exception as e:
            logger.error(f"Failed to retrieve experiment {experiment_id}: {e}")
            return None

