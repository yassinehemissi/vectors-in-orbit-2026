from __future__ import annotations

from typing import Dict, List, Tuple


def extract_tables(docling_json: Dict[str, object]) -> List[Tuple[str, List[List[str]]]]:
    tables = []
    raw_tables = docling_json.get("tables") if isinstance(docling_json, dict) else None
    if not isinstance(raw_tables, list):
        return tables
    print(f"[pdf_to_infra] extracting tables={len(raw_tables)}")
    for i, t in enumerate(raw_tables, start=1):
        if not isinstance(t, dict):
            continue
        rows = _rows_from_docling_table(t)
        if rows:
            tables.append((f"table_{i:03d}.csv", rows))
    print(f"[pdf_to_infra] extracted tables={len(tables)}")
    return tables


def _rows_from_docling_table(table: Dict[str, object]) -> List[List[str]]:
    data = table.get("data")
    if not isinstance(data, dict):
        return []

    grid = data.get("grid")
    if isinstance(grid, list) and grid:
        out_rows: List[List[str]] = []
        for row in grid:
            if not isinstance(row, list):
                continue
            out_row: List[str] = []
            for cell in row:
                if isinstance(cell, dict):
                    out_row.append(str(cell.get("text") or ""))
                else:
                    out_row.append(str(cell))
            out_rows.append(out_row)
        return out_rows

    table_cells = data.get("table_cells")
    num_rows = data.get("num_rows")
    num_cols = data.get("num_cols")
    if not isinstance(table_cells, list) or not isinstance(num_rows, int) or not isinstance(num_cols, int):
        return []

    matrix: List[List[str]] = [["" for _ in range(num_cols)] for _ in range(num_rows)]
    for cell in table_cells:
        if not isinstance(cell, dict):
            continue
        r0 = cell.get("start_row_offset_idx")
        c0 = cell.get("start_col_offset_idx")
        if isinstance(r0, int) and isinstance(c0, int):
            text = str(cell.get("text") or "")
            if 0 <= r0 < num_rows and 0 <= c0 < num_cols:
                matrix[r0][c0] = text
    return matrix
