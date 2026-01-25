from cassandra.cluster import Cluster
from config import Config

cluster = Cluster(Config.SCYLLADB_HOSTS, port=Config.SCYLLADB_PORT)
session = cluster.connect()
session.set_keyspace(Config.SCYLLADB_KEYSPACE)

try:
    print("Testing with %s...")
    session.execute("SELECT * FROM scientific_experiments WHERE experiment_id = %s", ("test",))
    print("Success with %s")
except Exception as e:
    print(f"Failed with %s: {e}")

try:
    print("Testing with ?...")
    session.execute("SELECT * FROM scientific_experiments WHERE experiment_id = ?", ("test",))
    print("Success with ?")
except Exception as e:
    print(f"Failed with ?: {e}")
