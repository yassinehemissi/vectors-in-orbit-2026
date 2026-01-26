from __future__ import annotations

from typing import Dict, List, Optional

from lxml import etree
from lxml.etree import XMLSyntaxError

from .text import norm_text


TEI_NS = {"tei": "http://www.tei-c.org/ns/1.0"}


def parse_tei(tei_xml: str) -> etree._Element:
    parser = etree.XMLParser(recover=False, huge_tree=True)
    try:
        return etree.fromstring(tei_xml.encode("utf-8"), parser=parser)
    except XMLSyntaxError as e:
        raise ValueError(f"Invalid TEI XML (XMLSyntaxError): {e}") from e


def tei_xml_snippet(node: etree._Element) -> str:
    return etree.tostring(node, encoding="unicode")


def iter_text(node: etree._Element) -> str:
    return "".join(node.itertext())


def render_tei_table_to_markdown(tb: etree._Element) -> str:
    rows = tb.xpath("./tei:row", namespaces=TEI_NS)
    if not rows:
        flat = norm_text("".join(tb.itertext()))
        return f"| {flat} |" if flat else ""

    md_lines: List[str] = []
    for r in rows:
        cells = [
            norm_text("".join(c.itertext()))
            for c in r.xpath(".//tei:cell|.//tei:th", namespaces=TEI_NS)
        ]
        md_lines.append("| " + " | ".join(cells) + " |")

    return "\n".join(md_lines).strip()
