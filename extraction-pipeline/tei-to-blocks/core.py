from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Dict, List, Optional

from lxml import etree

from .config import ConverterConfig
from .figures import detect_figure_caption
from .models import Block, BlockBuilder
from .tables import df_to_markdown, extract_table_ref, try_parse_table_to_df
from .tei import TEI_NS, iter_text, parse_tei, render_tei_table_to_markdown, tei_xml_snippet
from .text import chunk_by_sentences, norm_text, stable_block_id


@dataclass
class TEIToBlocks:
    config: ConverterConfig = ConverterConfig()

    def tei_to_blocks_json(
        self,
        tei_xml: str,
        include_front: Optional[bool] = None,
        include_back: Optional[bool] = None,
        max_block_chars: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        cfg = self.config
        front = cfg.include_front if include_front is None else include_front
        back = cfg.include_back if include_back is None else include_back
        max_chars = cfg.chunking.max_chars if max_block_chars is None else max_block_chars

        root = parse_tei(tei_xml)
        tree = root.getroottree()

        @lru_cache(maxsize=None)
        def getpath(node: etree._Element) -> str:
            return tree.getpath(node)

        builder = BlockBuilder()

        def add_block(
            btype: str,
            text: str,
            section_path: List[str],
            node: etree._Element,
            extra: Optional[Dict[str, Any]] = None,
            chunk_index: Optional[int] = None,
            chunk_total: Optional[int] = None,
        ) -> None:
            text = norm_text(text)
            if not text:
                return

            xpath = getpath(node)
            xml_id = node.get("{http://www.w3.org/XML/1998/namespace}id")

            id_anchor = xml_id if xml_id else xpath
            id_parts = [btype, id_anchor]
            if chunk_index is not None and chunk_total is not None:
                id_parts.append(f"{chunk_index}/{chunk_total}")
            block_id = stable_block_id(*id_parts)

            source: Dict[str, Any] = {"tei_xpath": xpath}
            if xml_id:
                source["xml_id"] = xml_id
            if extra:
                source.update(extra)

            chunk = None
            if chunk_index is not None and chunk_total is not None:
                chunk = {"index": chunk_index, "total": chunk_total}

            builder.add(
                Block(
                    block_id=block_id,
                    type=btype,
                    section_path=list(section_path),
                    text=text,
                    source=source,
                    chunk=chunk,
                )
            )

        def emit_chunks(
            btype: str,
            text: str,
            section_path: List[str],
            node: etree._Element,
        ) -> None:
            chunks = chunk_by_sentences(text, max_chars, cfg.chunking.max_sentences)
            for i, ch in enumerate(chunks, start=1):
                add_block(
                    btype,
                    ch,
                    section_path,
                    node,
                    chunk_index=i if len(chunks) > 1 else None,
                    chunk_total=len(chunks) if len(chunks) > 1 else None,
                )

        def emit_promoted_table_from_paragraph(
            p: etree._Element,
            section_path: List[str],
            raw: str,
        ) -> bool:
            df = try_parse_table_to_df(raw, cfg.tables)
            if df is None:
                return False

            label = extract_table_ref(raw)
            if label:
                add_block(
                    "table_label",
                    label,
                    section_path,
                    p,
                    extra={"xml": tei_xml_snippet(p), "promoted_from": "paragraph"},
                )

            add_block(
                "table_body",
                df_to_markdown(df),
                section_path,
                p,
                extra={"xml": tei_xml_snippet(p), "promoted_from": "paragraph"},
            )
            return True

        def emit_figure_caption_from_paragraph(
            p: etree._Element,
            section_path: List[str],
            raw: str,
        ) -> bool:
            detected = detect_figure_caption(raw, cfg.figures)
            if not detected:
                return False

            caption, label = detected
            extra = {"xml": tei_xml_snippet(p), "promoted_from": "paragraph"}
            if label:
                extra["figure_label"] = label
            add_block("figure_caption", caption, section_path, p, extra=extra)
            return True

        def emit_teitable(tb: etree._Element, section_path: List[str]) -> None:
            md = render_tei_table_to_markdown(tb)
            if md:
                add_block("table_body", md, section_path, tb, extra={"xml": tei_xml_snippet(tb)})

        def walk_div(div: etree._Element, section_stack: List[str]) -> None:
            heads = div.xpath("./tei:head", namespaces=TEI_NS)
            local_stack = list(section_stack)

            if heads:
                htxt = norm_text(iter_text(heads[0]))
                if htxt:
                    add_block("section_title", htxt, local_stack + [htxt], heads[0])
                    local_stack.append(htxt)

            for p in div.xpath("./tei:p", namespaces=TEI_NS):
                raw = norm_text(iter_text(p))
                if not raw:
                    continue

                if emit_figure_caption_from_paragraph(p, local_stack, raw):
                    continue

                if emit_promoted_table_from_paragraph(p, local_stack, raw):
                    continue

                emit_chunks("paragraph", raw, local_stack, p)

            for fig in div.xpath(".//tei:figure", namespaces=TEI_NS):
                fig_id = fig.get("{http://www.w3.org/XML/1998/namespace}id")
                for fd in fig.xpath("./tei:figDesc", namespaces=TEI_NS):
                    cap = norm_text(iter_text(fd))
                    if cap:
                        extra = {"figure_id": fig_id} if fig_id else None
                        add_block("figure_caption", cap, local_stack, fd, extra=extra)

            for tb in div.xpath(".//tei:table", namespaces=TEI_NS):
                emit_teitable(tb, local_stack)

            for f in div.xpath(".//tei:formula", namespaces=TEI_NS):
                ftxt = norm_text(iter_text(f))
                if ftxt:
                    add_block("equation", ftxt, local_stack, f)

            for child in div.xpath("./tei:div", namespaces=TEI_NS):
                walk_div(child, local_stack)

        if front:
            for t in root.xpath(".//tei:teiHeader//tei:titleStmt//tei:title", namespaces=TEI_NS):
                txt = norm_text(iter_text(t))
                if txt:
                    add_block("title", txt, ["front"], t)

            for a in root.xpath(".//tei:text/tei:front//tei:abstract", namespaces=TEI_NS):
                txt = norm_text(iter_text(a))
                if txt:
                    emit_chunks("abstract", txt, ["front", "abstract"], a)

        body_nodes = root.xpath(".//tei:text/tei:body", namespaces=TEI_NS)
        body = body_nodes[0] if body_nodes else root

        top_divs = body.xpath("./tei:div", namespaces=TEI_NS)
        if top_divs:
            for d in top_divs:
                walk_div(d, [])
        else:
            for p in body.xpath(".//tei:p", namespaces=TEI_NS):
                raw = norm_text(iter_text(p))
                if not raw:
                    continue

                if emit_figure_caption_from_paragraph(p, [], raw):
                    continue

                if emit_promoted_table_from_paragraph(p, [], raw):
                    continue

                emit_chunks("paragraph", raw, [], p)

            for tb in body.xpath(".//tei:table", namespaces=TEI_NS):
                emit_teitable(tb, [])

        if back:
            for back_node in root.xpath(".//tei:text/tei:back", namespaces=TEI_NS):
                txt = norm_text(iter_text(back_node))
                if txt:
                    emit_chunks("back_matter", txt, ["back"], back_node)

        return builder.as_dicts()


def tei_to_blocks_json(
    tei_xml: str,
    include_front: bool = True,
    include_back: bool = False,
    max_block_chars: int = 1200,
) -> List[Dict[str, Any]]:
    return TEIToBlocks().tei_to_blocks_json(
        tei_xml=tei_xml,
        include_front=include_front,
        include_back=include_back,
        max_block_chars=max_block_chars,
    )
