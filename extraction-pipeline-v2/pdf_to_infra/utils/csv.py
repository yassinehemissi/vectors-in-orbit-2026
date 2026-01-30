from __future__ import annotations

from typing import List


def rows_to_csv_bytes(rows: List[List[str]]) -> bytes:
    out = []
    for r in rows:
        out.append(",".join("\"" + c.replace("\"", "\"\"") + "\"" for c in r))
    return ("\n".join(out)).encode("utf-8")
