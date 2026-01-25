from cassandra.cluster import Cluster
import json

cluster = Cluster(['127.0.0.1'])
session = cluster.connect('scientific_papers')

rows = session.execute("SELECT * FROM scientific_experiments LIMIT 5")
print(f"Total rows found: {len(list(rows))}")
for row in session.execute("SELECT * FROM scientific_experiments LIMIT 5"):
    print(f"ID: {row.experiment_id}")
    print(f"Target: {row.protein_or_target}")
    print(f"Method: {row.methodology}")
    print("---")
