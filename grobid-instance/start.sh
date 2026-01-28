#!/usr/bin/env bash
set -euo pipefail

/opt/grobid/bin/grobid-service &

python3 - <<'PY'
import os
import time
import requests

url = os.environ.get("GROBID_URL", "http://127.0.0.1:8070") + "/api/isalive"
for _ in range(60):
    try:
        if requests.get(url, timeout=2).ok:
            print("GROBID ready")
            break
    except Exception:
        pass
    time.sleep(2)
PY

exec python3 /app/app.py
