from __future__ import annotations

import json
import os
from pathlib import Path

from flask import Flask, jsonify, request

from pipeline import process_pdf, process_tei, run_experiments
from env import load_env
load_env()
app = Flask(__name__)

@app.post("/process")
def process():
    payload = request.get_json(silent=True) or {}
    tei_xml = payload.get("tei_xml")
    pdf_path = payload.get("pdf_path")
    run_exp = True #bool(payload.get("run_experiments"))

    if not tei_xml and not pdf_path:
        return jsonify({"error": "Provide tei_xml or pdf_path"}), 400

    if tei_xml and pdf_path:
        return jsonify({"error": "Use only one of tei_xml or pdf_path"}), 400

    if pdf_path:
        hblocks = process_pdf(Path(pdf_path))
    else:
        hblocks = process_tei(tei_xml)

    output = {"hblocks": hblocks}

    if run_exp:
        meta = hblocks.get("meta") if isinstance(hblocks, dict) else None
        paper_id = meta.get("paper_id") if isinstance(meta, dict) else None
        if paper_id:
            output["experiments"] = run_experiments(str(paper_id))
        else:
            output["experiments_error"] = "paper_id missing from hblocks meta"

    return jsonify(output)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 4000)))
