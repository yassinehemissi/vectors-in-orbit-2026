from qdrant_client import QdrantClient
client = QdrantClient(url="http://localhost:6333")
try:
    # Use real collection name
    res = client.query_points(collection_name="experiments", query=[0.1]*384, limit=1)
    print(f"Res type: {type(res)}")
    print(f"Res points: {res.points if hasattr(res, 'points') else 'no points attr'}")
    if hasattr(res, 'points') and len(res.points) > 0:
        p = res.points[0]
        print(f"Point type: {type(p)}")
        print(f"Point dir: {dir(p)}")
except Exception as e:
    print(f"Error: {e}")
