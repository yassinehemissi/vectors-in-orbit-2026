"use client";

import { useEffect, useMemo, useState } from "react";
import { getPaperPdfUrl, getPaperStructureWithOffsets } from "@/storage/papers-data";
import dynamic from "next/dynamic";

const PdfEvidenceViewer = dynamic(
  () =>
    import("@/components/dashboard/pdf-evidence-viewer").then(
      (mod) => mod.PdfEvidenceViewer,
    ),
  { ssr: false },
);

type PdfHighlight = {
  page: number;
  l: number;
  t: number;
  r: number;
  b: number;
  coordOrigin?: string;
  label?: string;
};

type DoclingRef = string;

const normalizeRef = (value?: unknown) => {
  if (!value) return "";
  return String(value).trim();
};

const collectStructureBlocks = (structure: any) => {
  const sections = Array.isArray(structure?.sections) ? structure.sections : [];
  return sections.flatMap((section: any) =>
    Array.isArray(section?.blocks)
      ? section.blocks.map((block: any) => ({
          ...block,
          sectionTitle: section?.title ?? section?.section_title,
          sectionId: section?.section_id,
          sectionRef: section?.docling_ref ?? section?.section_id,
        }))
      : [],
  );
};

const matchBlocksByRef = (blocks: any[], doclingRefs: DoclingRef[]) => {
  const refSet = new Set(doclingRefs.map((ref) => normalizeRef(ref)));
  return blocks.filter((block) => {
    const candidates = [
      block?.docling_ref,
      block?.block_id,
      block?.id,
      block?.ref,
      block?.sectionRef,
    ]
      .filter(Boolean)
      .map((value) => normalizeRef(value));
    return candidates.some((value) => refSet.has(value));
  });
};

export function PdfEvidenceDrawer({
  isOpen,
  onClose,
  paperId,
  doclingRefs,
  title,
  highlightLabel,
}: {
  isOpen: boolean;
  onClose: () => void;
  paperId: string;
  doclingRefs: DoclingRef[];
  title?: string;
  highlightLabel?: string;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<PdfHighlight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setWarning(null);
    Promise.all([getPaperPdfUrl(paperId), getPaperStructureWithOffsets(paperId)])
      .then(([pdf, structure]) => {
        if (!isMounted) return;
        setPdfUrl(pdf);
        if (!structure) {
          setHighlights([]);
          setWarning("Structure data is unavailable. Showing PDF without highlights.");
        }
        if (structure && doclingRefs.length) {
          const blocks = collectStructureBlocks(structure);
          const matches = matchBlocksByRef(blocks, doclingRefs);
          const nextHighlights: PdfHighlight[] = [];
          matches.forEach((block) => {
            const provs = Array.isArray(block?.prov) ? block.prov : [];
            provs.forEach((prov: any) => {
              const page = Number(prov?.page_no ?? 1);
              const bbox = prov?.bbox;
              if (!bbox) return;
              nextHighlights.push({
                page,
                l: Number(bbox.l ?? 0),
                t: Number(bbox.t ?? 0),
                r: Number(bbox.r ?? 0),
                b: Number(bbox.b ?? 0),
                coordOrigin: bbox.coord_origin,
                label: highlightLabel ?? "Evidence",
              });
            });
          });
          setHighlights(nextHighlights);
        }
        if (!pdf) {
          setError("PDF not found in uploads.");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Unable to load PDF highlights.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [doclingRefs, isOpen, paperId]);

  const initialPage = useMemo(() => {
    if (!highlights.length) return undefined;
    return highlights[0].page;
  }, [highlights]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/40">
      <div className="absolute right-0 top-0 flex h-full w-full max-w-[760px] flex-col overflow-hidden border-l border-neutral-200/70 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-neutral-200/70 p-6">
          <div>
            <p className="text-xs uppercase text-neutral-400">PDF highlight</p>
            <h3 className="text-lg font-semibold text-neutral-900">
              {title ?? "Evidence highlight"}
            </h3>
          </div>
          <button type="button" className="btn-secondary text-xs" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="p-6 text-sm text-neutral-500">
              Loading PDF...
            </div>
          ) : null}
          {error ? (
            <div className="p-6 text-sm text-neutral-500">
              {error}
            </div>
          ) : null}
          {warning ? (
            <div className="p-4 text-xs text-amber-700">
              {warning}
            </div>
          ) : null}
          {!isLoading && !error && pdfUrl ? (
            <PdfEvidenceViewer
              pdfUrl={pdfUrl}
              highlights={highlights}
              initialPage={initialPage}
              className="h-full w-full"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
