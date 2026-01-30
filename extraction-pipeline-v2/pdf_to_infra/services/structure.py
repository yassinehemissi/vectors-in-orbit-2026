from __future__ import annotations

from typing import Dict, Iterable, List, Tuple


def build_structure(docling_json: Dict[str, object], hash_key: str, *, include_text: bool = True) -> Dict[str, object]:
    if not isinstance(docling_json, dict):
        return {"paper_id": hash_key, "sections": [], "meta": {"source": "docling"}}

    print(f"[pdf_to_infra] build_structure include_text={include_text}")
    index = _build_ref_index(docling_json)
    body = docling_json.get("body") or {}
    children = body.get("children") or []

    sections: List[Dict[str, object]] = []
    section_index = 1
    block_index = 0
    current = {"section_id": f"s_{section_index:04d}", "title": "Front Matter", "blocks": []}

    for kind, item in _iter_body_items(children, index):
        label = item.get("label")
        if label in ("page_header", "page_footer"):
            continue

        if kind == "text" and label == "section_header":
            title = str(item.get("text") or "").strip()
            if title:
                if current["blocks"] or current["title"] != "Front Matter":
                    sections.append(current)
                section_index += 1
                current = {"section_id": f"s_{section_index:04d}", "title": title, "blocks": []}
            continue

        block_index += 1
        block = _build_block(kind, item, index, block_index, include_text=include_text)
        if block:
            current["blocks"].append(block)

    if current["blocks"] or current["title"]:
        sections.append(current)

    print(f"[pdf_to_infra] build_structure sections={len(sections)}")
    return {
        "paper_id": hash_key,
        "sections": sections,
        "meta": {"source": "docling"},
    }


def _build_ref_index(docling_json: Dict[str, object]) -> Dict[str, Tuple[str, Dict[str, object]]]:
    index: Dict[str, Tuple[str, Dict[str, object]]] = {}
    for kind, key in (("text", "texts"), ("group", "groups"), ("table", "tables"), ("picture", "pictures")):
        items = docling_json.get(key)
        if not isinstance(items, list):
            continue
        for item in items:
            if isinstance(item, dict) and item.get("self_ref"):
                index[str(item["self_ref"])] = (kind, item)
    return index


def _iter_body_items(
    children: Iterable[object], index: Dict[str, Tuple[str, Dict[str, object]]]
) -> Iterable[Tuple[str, Dict[str, object]]]:
    for child in children:
        if not isinstance(child, dict) or "$ref" not in child:
            continue
        ref = str(child["$ref"])
        resolved = index.get(ref)
        if not resolved:
            continue
        kind, item = resolved
        if kind == "group":
            for sub in _iter_body_items(item.get("children") or [], index):
                yield sub
        else:
            yield kind, item


def _build_block(
    kind: str,
    item: Dict[str, object],
    index: Dict[str, Tuple[str, Dict[str, object]]],
    block_index: int,
    *,
    include_text: bool,
) -> Dict[str, object] | None:
    block: Dict[str, object] = {"block_id": f"b_{block_index:05d}", "kind": kind, "label": item.get("label")}
    if kind == "text":
        text = str(item.get("text") or "").strip()
        if not text:
            return None
        if include_text:
            block["text"] = text
    elif kind in ("table", "picture"):
        block["ref"] = item.get("self_ref")
        captions = _resolve_caption_texts(item.get("captions"), index)
        if captions and include_text:
            block["caption"] = captions
    else:
        return None

    prov = item.get("prov")
    if isinstance(prov, list) and prov:
        block["prov"] = prov
    return block


def _resolve_caption_texts(
    captions: object, index: Dict[str, Tuple[str, Dict[str, object]]]
) -> List[str]:
    if not isinstance(captions, list):
        return []
    out: List[str] = []
    for ref in captions:
        if not isinstance(ref, dict) or "$ref" not in ref:
            continue
        resolved = index.get(str(ref["$ref"]))
        if not resolved:
            continue
        kind, item = resolved
        if kind == "text":
            text = str(item.get("text") or "").strip()
            if text:
                out.append(text)
    return out
