from __future__ import annotations

import json
import tempfile
from pathlib import Path
from typing import Dict, List

from flask import Blueprint, jsonify, request

from ..services.docling import call_docling
from ..services.figures import extract_figures
from ..services.grobid import call_grobid_metadata
from ..services.storage import exists_remote, upload_file
from ..services.structure import build_structure
from ..services.tables import extract_tables
from ..utils.csv import rows_to_csv_bytes
from ..utils.hash import hash_pdf
from storage.papers_data import store_paper_data

bp = Blueprint("process", __name__)


@bp.post("/process")
def process_pdf():
    print("[pdf_to_infra] /process start")
    if "file" not in request.files:
        return jsonify({"error": "file field required"}), 400

    pdf = request.files["file"]
    data = pdf.read()
    if not data:
        return jsonify({"error": "empty file"}), 400

    hash_key = hash_pdf(data)
    print(f"[pdf_to_infra] hash={hash_key}")

    if exists_remote(hash_key):
        print(f"[pdf_to_infra] exists_remote=true")
        return jsonify({"hash": hash_key, "exists": True}), 200

    docling_json: Dict[str, object] | None = None
    if "docling" in request.files:
        docling_file = request.files["docling"]
        try:
            docling_json = json.loads(docling_file.read().decode("utf-8"))
            print("[pdf_to_infra] using uploaded docling json")
        except Exception:
            return jsonify({"error": "invalid docling json"}), 400

    with tempfile.TemporaryDirectory() as tmpdir:
        pdf_path = Path(tmpdir) / "input.pdf"
        pdf_path.write_bytes(data)

        if docling_json is None:
            print("[pdf_to_infra] calling docling")
            docling_json = call_docling(pdf_path)
        print("[pdf_to_infra] calling grobid")
        metadata = call_grobid_metadata(pdf_path)
        print("[pdf_to_infra] building structure")
        structure = build_structure(docling_json, hash_key)
        structure_offsets = build_structure(docling_json, hash_key, include_text=False)

        print("[pdf_to_infra] extracting tables/figures")
        tables = extract_tables(docling_json)
        figures_meta, images = extract_figures(pdf_path)

        uploads: List[Dict[str, object]] = []
        uploads.append(
            {
                "path": f"[{hash_key}]original.pdf",
                "url": upload_file(hash_key, f"[{hash_key}]original.pdf", data, "application/pdf"),
            }
        )

        structure_bytes = json.dumps(structure, ensure_ascii=False, indent=2).encode("utf-8")
        uploads.append(
            {
                "path": f"[{hash_key}]structure.json",
                "url": upload_file(hash_key, f"[{hash_key}]structure.json", structure_bytes, "application/json"),
            }
        )

        structure_offsets_bytes = json.dumps(
            structure_offsets, ensure_ascii=False, indent=2
        ).encode("utf-8")
        uploads.append(
            {
                "path": f"[{hash_key}]structure_with_offset.json",
                "url": upload_file(
                    hash_key,
                    f"[{hash_key}]structure_with_offset.json",
                    structure_offsets_bytes,
                    "application/json",
                ),
            }
        )

        figures_bytes = json.dumps(figures_meta, ensure_ascii=False, indent=2).encode("utf-8")
        uploads.append(
            {
                "path": f"[{hash_key}]figures.json",
                "url": upload_file(hash_key, f"[{hash_key}]figures.json", figures_bytes, "application/json"),
            }
        )

        metadata_bytes = json.dumps(metadata, ensure_ascii=False, indent=2).encode("utf-8")
        uploads.append(
            {
                "path": f"[{hash_key}]metadata.json",
                "url": upload_file(hash_key, f"[{hash_key}]metadata.json", metadata_bytes, "application/json"),
            }
        )

        for name, rows in tables:
            csv_bytes = rows_to_csv_bytes(rows)
            uploads.append(
                {
                    "path": f"[{hash_key}]{name}",
                    "url": upload_file(hash_key, f"[{hash_key}]{name}", csv_bytes, "text/csv"),
                }
            )

        for name, img_bytes in images:
            uploads.append(
                {
                    "path": f"[{hash_key}]{name}",
                    "url": upload_file(hash_key, f"[{hash_key}]{name}", img_bytes, "image/png"),
                }
            )

    result = {"hash": hash_key, "uploads": uploads}
    try:
        store_paper_data(hash_key, result)
    except Exception:
        pass

    print("[pdf_to_infra] /process done")
    return jsonify(result)
