from qdrant_client import QdrantClient
from cassandra.cluster import Cluster

q_client = QdrantClient(url="http://localhost:6333")
count = q_client.count(collection_name="experiments")
print(f"Qdrant points: {count.count}")

cluster = Cluster(['127.0.0.1'])
session = cluster.connect('scientific_papers')
rows = session.execute("SELECT count(*) FROM scientific_experiments")
print(f"ScyllaDB rows: {rows[0].count}")

# Check first row
rows = session.execute("SELECT * FROM scientific_experiments LIMIT 1")
for row in rows:
    print(f"Sample - ID: {row.experiment_id}, Target: {row.protein_or_target}, Method: {row.methodology}")
