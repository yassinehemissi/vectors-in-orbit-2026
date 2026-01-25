from cassandra.cluster import Cluster
from config import Config
import sys

try:
    cluster = Cluster(Config.SCYLLADB_HOSTS, port=Config.SCYLLADB_PORT)
    session = cluster.connect()
    session.set_keyspace(Config.SCYLLADB_KEYSPACE)
    
    rows = session.execute("SELECT count(*) FROM scientific_experiments")
    count = rows[0].count
    print(f"Scientific Experiments count: {count}")
    
    if count > 0:
        rows = session.execute("SELECT * FROM scientific_experiments LIMIT 2")
        for row in rows:
            print(f"ID: {row.experiment_id} | Target: {row.protein_or_target} | Method: {row.methodology}")
except Exception as e:
    print(f"Error: {e}")
