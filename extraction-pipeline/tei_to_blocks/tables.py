from __future__ import annotations

import io
import re
from typing import List, Optional

import pandas as pd

from .config import TableDetectionConfig
from .text import norm_text


_MULTI_SPACE = re.compile(r"[ \t]{2,}")
_TABLE_REF = re.compile(r"\bTable\s+(\d+)\b", re.IGNORECASE)
_ITER_MARK = re.compile(r"\bITERATION\s*=\s*\d+\b", re.IGNORECASE)
_PCT = re.compile(r"\b\d+(?:\.\d+)?\s*%\b")
_NUM_LIKE = re.compile(r"\b-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?\b")

_ROW_MARKERS = [_ITER_MARK]


def extract_table_ref(text: str) -> Optional[str]:
    m = _TABLE_REF.search(text or "")
    if not m:
        return None
    return f"Table {int(m.group(1))}"


def split_pseudo_rows(raw: str) -> List[str]:
    raw = (raw or "").replace("\r\n", "\n").replace("\r", "\n").strip()
    if not raw:
        return []

    lines = [ln.strip() for ln in raw.split("\n") if ln.strip()]
    if len(lines) >= 2:
        return lines

    s = lines[0] if lines else raw
    for rx in _ROW_MARKERS:
        hits = list(rx.finditer(s))
        if len(hits) >= 3:
            rows: List[str] = []
            header = s[: hits[0].start()].strip()
            if header:
                rows.append(header)
            for i, h in enumerate(hits):
                start = h.start()
                end = hits[i + 1].start() if i + 1 < len(hits) else len(s)
                rows.append(s[start:end].strip())
            return rows

    return [s]


def cheap_table_prefilter(text: str, cfg: TableDetectionConfig) -> bool:
    t = text or ""
    if len(t) < cfg.min_text_len:
        return False

    if len(_ITER_MARK.findall(t)) >= 3:
        return True

    rows = split_pseudo_rows(t)
    if len(rows) < cfg.min_rows:
        return False

    multi_space_rows = sum(1 for r in rows[:12] if _MULTI_SPACE.search(r))
    if multi_space_rows >= cfg.min_multi_space_rows:
        numeric_hits = sum(len(_NUM_LIKE.findall(r)) for r in rows[:12])
        if numeric_hits >= cfg.min_numeric_hits:
            return True

    total_nums = len(_NUM_LIKE.findall(t))
    total_pcts = len(_PCT.findall(t))
    if (total_nums + total_pcts) >= cfg.min_total_numeric and len(rows) >= 3:
        return True

    return False


def try_parse_table_to_df(raw: str, cfg: TableDetectionConfig) -> Optional[pd.DataFrame]:
    if not cheap_table_prefilter(raw, cfg):
        return None

    rows = split_pseudo_rows(raw)
    if len(rows) < cfg.min_rows:
        return None

    kept: List[str] = []
    for r in rows:
        nums = len(_NUM_LIKE.findall(r)) + len(_PCT.findall(r))
        if _MULTI_SPACE.search(r) or nums >= 6 or _ITER_MARK.search(r):
            kept.append(r)

    if len(kept) < cfg.min_rows:
        return None

    text_for_pandas = "\n".join(kept)

    try:
        df = pd.read_csv(
            io.StringIO(text_for_pandas),
            sep=r"\s{2,}|\t",
            engine="python",
        )
    except Exception:
        return None

    df = df.dropna(axis=0, how="all").dropna(axis=1, how="all")
    if df.shape[0] < cfg.min_df_rows or df.shape[1] < cfg.min_df_cols:
        return None

    return df


def df_to_markdown(df: pd.DataFrame) -> str:
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]
    return df.to_markdown(index=False)


def norm_table_text(text: str) -> str:
    return norm_text(text)
