from __future__ import annotations

import hashlib
import re
from functools import lru_cache
from typing import List, Tuple

import spacy


_NLP = spacy.blank("en")
_NLP.add_pipe("sentencizer")

_WS = re.compile(r"\s+")


def norm_text(text: str) -> str:
    return _WS.sub(" ", (text or "").replace("\u00a0", " ")).strip()


def stable_block_id(*parts: str, prefix: str = "b") -> str:
    h = hashlib.sha256("||".join(parts).encode("utf-8")).hexdigest()[:12]
    return f"{prefix}_{h}"


@lru_cache(maxsize=4096)
def sentences_cached(text: str) -> Tuple[str, ...]:
    text = norm_text(text)
    if not text:
        return tuple()
    doc = _NLP(text)
    return tuple(sent.text.strip() for sent in doc.sents if sent.text.strip())


def chunk_by_sentences(text: str, max_chars: int, max_sentences: int) -> List[str]:
    text = norm_text(text)
    if not text:
        return []
    sents = sentences_cached(text)
    if not sents:
        return []

    chunks: List[str] = []
    cur: List[str] = []
    cur_len = 0

    for s in sents:
        s_len = len(s)
        if not cur:
            cur = [s]
            cur_len = s_len
            continue

        if len(cur) >= max_sentences or (cur_len + 1 + s_len) > max_chars:
            chunks.append(norm_text(" ".join(cur)))
            cur = [s]
            cur_len = s_len
        else:
            cur.append(s)
            cur_len += 1 + s_len

    if cur:
        chunks.append(norm_text(" ".join(cur)))

    return [c for c in chunks if c]
