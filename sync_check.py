from qdrant_client import QdrantClient
from cassandra.cluster import Cluster
from config import Config
import json

# 1. Connect to Qdrant
q_client = QdrantClient(url=Config.QDRANT_URL)
print(f"--- Qdrant Collection: {Config.QDRANT_COLLECTION} ---")
try:
    points = q_client.scroll(collection_name=Config.QDRANT_COLLECTION, limit=10)[0]
    print(f"Found {len(points)} points in Qdrant")
    q_ids = []
    for p in points:
        print(f"Qdrant ID: {p.id}")
        q_ids.append(str(p.id))
except Exception as e:
    print(f"Qdrant Error: {e}")
    q_ids = []

# 2. Connect to ScyllaDB
print(f"\n--- ScyllaDB Keyspace: {Config.SCYLLADB_KEYSPACE} ---")
try:
    cluster = Cluster(Config.SCYLLADB_HOSTS, port=Config.SCYLLADB_PORT)
    session = cluster.connect()
    session.set_keyspace(Config.SCYLLADB_KEYSPACE)
    
    rows = session.execute("SELECT experiment_id, protein_or_target FROM scientific_experiments")
    s_ids = []
    for row in rows:
        print(f"ScyllaDB ID: {row.experiment_id} | Target: {row.protein_or_target}")
        s_ids.append(str(row.experiment_id))
    
    print(f"\nTotal ScyllaDB records: {len(s_ids)}")
except Exception as e:
    print(f"ScyllaDB Error: {e}")
    s_ids = []

# 3. Intersection
missing = [qid for qid in q_ids if qid not in s_ids]
if missing:
    print(f"\nCRITICAL: {len(missing)} IDs found in Qdrant but MISSING in ScyllaDB!")
    for m in missing:
        print(f"  Missing ID: {m}")
else:
    print("\nSync Check: All Qdrant IDs found in ScyllaDB.")
