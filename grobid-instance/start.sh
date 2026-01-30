#!/usr/bin/env bash
set -euo pipefail

echo "[start] launching GROBID..."
/opt/grobid/grobid-service/bin/grobid-service &

echo "[start] waiting for GROBID readiness..."
for i in {1..60}; do
  if curl -fsS "http://127.0.0.1:8070/api/isalive" >/dev/null 2>&1; then
    echo "[start] GROBID is alive."
    break
  fi
  sleep 1
done

curl -fsS "http://127.0.0.1:8070/api/isalive" >/dev/null 2>&1 || {
  echo "[error] GROBID did not become ready in time."
  exit 1
}

echo "[start] launching API..."
exec python3 /app/app.py
