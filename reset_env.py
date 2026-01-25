from qdrant_client import QdrantClient
from cassandra.cluster import Cluster
from config import Config

# 1. Reset Qdrant
q_client = QdrantClient(url=Config.QDRANT_URL)
try:
    q_client.delete_collection(Config.QDRANT_COLLECTION)
    print(f"Deleted collection {Config.QDRANT_COLLECTION}")
except:
    pass

# 2. Reset ScyllaDB
cluster = Cluster(Config.SCYLLADB_HOSTS, port=Config.SCYLLADB_PORT)
session = cluster.connect()
try:
    session.execute(f"DROP KEYSPACE IF EXISTS {Config.SCYLLADB_KEYSPACE}")
    print(f"Dropped keyspace {Config.SCYLLADB_KEYSPACE}")
except Exception as e:
    print(f"Drop failed: {e}")

print("Clean start complete. Restart the server now to recreate schema.")
