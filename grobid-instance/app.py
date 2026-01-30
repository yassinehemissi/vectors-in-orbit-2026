import os

import requests
from flask import Flask, Response, jsonify, request

app = Flask(__name__)

GROBID_URL = os.environ.get("GROBID_URL", "http://127.0.0.1:8070")


@app.get("/")
def health():
    return jsonify({"status": "ok", "grobid": GROBID_URL})


@app.post("/process")
def process_pdf():
    print("process_pdf: request received")
    if "file" not in request.files:
        print("process_pdf: missing file field")
        return jsonify({"error": "file field required"}), 400

    try:
        print(f"process_pdf: checking grobid at {GROBID_URL}/api/isalive")
        alive = requests.get(f"{GROBID_URL}/api/isalive", timeout=2)
        if not alive.ok:
            print(f"process_pdf: grobid not ready status={alive.status_code}")
            return jsonify({"error": "grobid_not_ready"}), 503
    except requests.RequestException as exc:
        print(f"process_pdf: grobid unreachable error={exc}")
        return jsonify({"error": "grobid_unreachable", "details": str(exc)}), 503

    pdf = request.files["file"]
    if not pdf.filename:
        print("process_pdf: empty filename")
        return jsonify({"error": "empty filename"}), 400

    files = {"input": (pdf.filename, pdf.stream, "application/pdf")}
    data = {
        "consolidateCitations": "0",
        "consolidateHeader": "0",
        "includeRawAffiliations": "1",
        "includeRawCitations": "1",
        "teiCoordinates": "0",
        "segmentSentences": "0",
    }

    try:
        print("process_pdf: calling grobid processFulltextDocument")
        resp = requests.post(
            f"{GROBID_URL}/api/processFulltextDocument",
            files=files,
            data=data,
            timeout=300,
        )
    except requests.RequestException as exc:
        print(f"process_pdf: grobid request failed error={exc}")
        return jsonify({"error": "grobid_unreachable", "details": str(exc)}), 502

    print(f"process_pdf: grobid response status={resp.status_code} length={len(resp.text)}")
    return Response(resp.text, status=resp.status_code, content_type="application/xml")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "7860"))
    app.run(host="0.0.0.0", port=port)
