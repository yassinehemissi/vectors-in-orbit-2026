"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type PdfHighlight = {
  page: number;
  l: number;
  t: number;
  r: number;
  b: number;
  coordOrigin?: string;
  label?: string;
};

export function PdfEvidenceViewer({
  pdfUrl,
  highlights,
  initialPage,
  className,
}: {
  pdfUrl: string;
  highlights: PdfHighlight[];
  initialPage?: number;
  className?: string;
}) {
  const [numPages, setNumPages] = useState(0);
  const [pageDims, setPageDims] = useState<Record<number, { w: number; h: number }>>(
    {},
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  const grouped = useMemo(() => {
    return highlights.reduce<Record<number, Array<PdfHighlight & { index: number }>>>(
      (acc, item, index) => {
        acc[item.page] ??= [];
        acc[item.page].push({ ...item, index });
        return acc;
      },
      {},
    );
  }, [highlights]);

  useEffect(() => {
    if (!initialPage) return;
    const el = document.getElementById(`pdf-page-${initialPage}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [initialPage, numPages]);

  useEffect(() => {
    if (!highlights.length || !numPages) return;
    let raf = 0;
    const attemptScroll = () => {
      const first = document.getElementById("pdf-highlight-0");
      if (first) {
        first.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      raf = requestAnimationFrame(attemptScroll);
    };
    raf = requestAnimationFrame(attemptScroll);
    return () => cancelAnimationFrame(raf);
  }, [highlights, numPages]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`h-full overflow-y-auto bg-neutral-50 ${className ?? ""}`}
    >
      <Document
        file={pdfUrl}
        onLoadSuccess={(doc) => setNumPages(doc.numPages)}
        loading={<div className="p-6 text-sm text-neutral-500">Loading PDF...</div>}
      >
        {Array.from({ length: numPages }, (_, index) => {
          const pageNumber = index + 1;
          const pageHighlights = grouped[pageNumber] ?? [];
          return (
            <div
              key={`page-${pageNumber}`}
              id={`pdf-page-${pageNumber}`}
              className="mb-6"
            >
              <div className="relative flex justify-center">
                <Page
                  pageNumber={pageNumber}
                  width={containerWidth ?? undefined}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onLoadSuccess={(page) => {
                    const viewport = page.getViewport({ scale: 1, rotation: page.rotate });
                    const w = viewport.width || page.width;
                    const h = viewport.height || page.height;
                    setPageDims((prev) => ({
                      ...prev,
                      [pageNumber]: {
                        w: w || page.width,
                        h: h || page.height,
                      },
                    }));
                  }}
                />
                {pageHighlights.length ? (
                  <div className="pointer-events-none absolute inset-0">
                    {pageHighlights.map((hl) => {
                      const dims = pageDims[pageNumber];
                      if (!dims) return null;
                      const left = Math.max(0, hl.l) / dims.w;
                      const width = Math.max(0, hl.r - hl.l) / dims.w;
                      const isBottomLeft = hl.coordOrigin === "BOTTOMLEFT";
                      const topRaw = isBottomLeft ? dims.h - hl.t : hl.t;
                      const heightRaw = isBottomLeft ? hl.t - hl.b : hl.b - hl.t;
                      const top = Math.max(0, topRaw) / dims.h;
                      const height = Math.max(0, heightRaw) / dims.h;
                      return (
                        <div
                          key={`${pageNumber}-${hl.index}`}
                          id={hl.index === 0 ? "pdf-highlight-0" : undefined}
                          className="absolute rounded-sm bg-amber-300/40 outline outline-1 outline-amber-400"
                          style={{
                            left: `${left * 100}%`,
                            top: `${top * 100}%`,
                            width: `${width * 100}%`,
                            height: `${height * 100}%`,
                          }}
                        >
                          {hl.label ? (
                            <span className="absolute -top-5 left-0 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] text-white">
                              {hl.label}
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </Document>
    </div>
  );
}
