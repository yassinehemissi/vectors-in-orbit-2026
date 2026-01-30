from __future__ import annotations

from pathlib import Path
from typing import Dict, List
from xml.etree import ElementTree as ET

import requests

from ..config import grobid_token, grobid_url

TEI_NS = {"tei": "http://www.tei-c.org/ns/1.0"}


def call_grobid_metadata(pdf_path: Path) -> Dict[str, object]:
    base = grobid_url()
    url = f"{base}/process" if base else ""
    if not url:
        raise ValueError("Missing GROBID_URL")
    headers = {"Accept": "application/xml"}
    token = grobid_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    print(f"[pdf_to_infra] grobid url={url}")
    with open(pdf_path, "rb") as f:
        files = {"file": (pdf_path.name, f, "application/pdf")}
        resp = requests.post(url, files=files, headers=headers, timeout=None)
        resp.raise_for_status()
        return _parse_tei_metadata(resp.text)


def _parse_tei_metadata(tei_xml: str) -> Dict[str, object]:
    try:
        root = ET.fromstring(tei_xml)
    except ET.ParseError:
        return {"title": None, "authors": [], "raw": None}

    title = None
    for t in root.findall(".//tei:teiHeader//tei:titleStmt//tei:title", TEI_NS):
        if t.text and t.text.strip():
            title = t.text.strip()
            if t.get("type") == "main":
                break

    authors: List[Dict[str, object]] = []
    for a in root.findall(".//tei:teiHeader//tei:author", TEI_NS):
        person = {"name": None, "forename": None, "surname": None, "affiliations": []}
        forename = a.find(".//tei:forename", TEI_NS)
        surname = a.find(".//tei:surname", TEI_NS)
        if forename is not None and forename.text:
            person["forename"] = forename.text.strip()
        if surname is not None and surname.text:
            person["surname"] = surname.text.strip()
        if person["forename"] or person["surname"]:
            person["name"] = " ".join(p for p in [person["forename"], person["surname"]] if p)

        affs = a.findall(".//tei:affiliation//tei:orgName", TEI_NS)
        for aff in affs:
            if aff.text and aff.text.strip():
                person["affiliations"].append(aff.text.strip())
        authors.append(person)

    return {"title": title, "authors": authors, "raw": None}
