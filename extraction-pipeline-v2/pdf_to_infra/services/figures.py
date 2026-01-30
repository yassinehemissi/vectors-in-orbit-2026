from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Tuple

import fitz  # PyMuPDF


def extract_figures(pdf_path: Path) -> Tuple[List[Dict[str, object]], List[Tuple[str, bytes]]]:
    doc = fitz.open(pdf_path)
    figures_meta: List[Dict[str, object]] = []
    images: List[Tuple[str, bytes]] = []
    print(f"[pdf_to_infra] extracting figures pages={len(doc)}")
    for page_index in range(len(doc)):
        page = doc[page_index]
        for img_idx, img in enumerate(page.get_images(full=True), start=1):
            xref = img[0]
            pix = fitz.Pixmap(doc, xref)
            if pix.n - pix.alpha > 3:
                pix = fitz.Pixmap(fitz.csRGB, pix)
            img_bytes = pix.tobytes("png")
            rects = page.get_image_rects(xref)
            bbox_list = []
            for r in rects:
                bbox_list.append({"x0": r.x0, "y0": r.y0, "x1": r.x1, "y1": r.y1})
            name = f"figure_p{page_index+1:03d}_{img_idx:03d}.png"
            images.append((name, img_bytes))
            figures_meta.append(
                {
                    "page": page_index + 1,
                    "name": name,
                    "bbox": bbox_list,
                }
            )
    print(f"[pdf_to_infra] extracted figures={len(images)}")
    return figures_meta, images
