from cassandra.cluster import Cluster
from config import Config

try:
    cluster = Cluster(Config.SCYLLADB_HOSTS, port=Config.SCYLLADB_PORT)
    session = cluster.connect()
    session.set_keyspace(Config.SCYLLADB_KEYSPACE)
    
    print("Clearing tables...")
    session.execute("TRUNCATE scientific_experiments")
    session.execute("TRUNCATE paper_metadata")
    print("Tables cleared.")
except Exception as e:
    print(f"Error clearing tables: {e}")
