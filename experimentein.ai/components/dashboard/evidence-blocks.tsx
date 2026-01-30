"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSectionById } from "@/storage/sections";
import { getPaperById } from "@/storage/papers";
import { PdfEvidenceDrawer } from "@/components/dashboard/pdf-evidence-drawer";

export type EvidenceBlock = {
  block_id: string;
  section_id?: string;
  text?: string;
  type?: string;
  block_index?: number;
  source?: string;
  docling_ref?: string;
};

export type EvidenceUploads = {
  figures: Array<{ path: string; url: string }>;
  tables: Array<{ path: string; url: string }>;
};

export function EvidenceDrawer({
  isOpen,
  isLoading,
  blocks,
  paperId,
  uploads,
  onClose,
}: {
  isOpen: boolean;
  isLoading: boolean;
  blocks: EvidenceBlock[];
  paperId: string;
  uploads: EvidenceUploads;
  onClose: () => void;
}) {
  const summary = useMemo(() => {
    if (isLoading) {
      return "Loading evidence…";
    }
    if (!blocks.length) {
      return "No evidence blocks found.";
    }
    const types = new Set(
      blocks.map((block) => block.type).filter((type): type is string => !!type),
    );
    return `${blocks.length} blocks · ${types.size || "N/A"} types`;
  }, [blocks, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-neutral-200/70 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-neutral-200/70 p-6">
          <div>
            <p className="text-xs uppercase text-neutral-400">Evidence</p>
            <h3 className="text-lg font-semibold text-neutral-900">
              Linked blocks
            </h3>
            <p className="mt-1 text-xs text-neutral-500">{summary}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="btn-secondary text-xs"
              href={`/dashboard/papers/${paperId}`}
            >
              View paper
            </Link>
            <button type="button" className="btn-secondary text-xs" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div className="max-h-[90vh] overflow-y-auto p-6">
          <EvidenceBlocksList
            blocks={blocks}
            isLoading={isLoading}
            paperId={paperId}
            uploads={uploads}
          />
        </div>
      </div>
    </div>
  );
}

export function EvidenceBlocksList({
  blocks,
  isLoading,
  paperId,
  uploads,
  showActions = true,
}: {
  blocks: EvidenceBlock[];
  isLoading?: boolean;
  paperId: string;
  uploads: EvidenceUploads;
  showActions?: boolean;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewSummary, setPreviewSummary] = useState("");
  const [previewKind, setPreviewKind] = useState<"paper" | "section" | null>(
    null,
  );
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"figure" | "table" | null>(null);
  const [mediaCaption, setMediaCaption] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfRefs, setPdfRefs] = useState<string[]>([]);

  const openPreview = async (kind: "paper" | "section", id?: string) => {
    if (!id) return;
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewKind(kind);
    try {
      if (kind === "section") {
        const section = await getSectionById(paperId, id);
        setPreviewTitle(section?.section_title ?? "Section");
        setPreviewSummary(section?.summary ?? "No summary available yet.");
      } else {
        const paper = await getPaperById(paperId);
        setPreviewTitle(paper?.title ?? "Paper");
        setPreviewSummary(paper?.summary ?? "No summary available yet.");
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
        Loading evidence...
      </div>
    );
  }

  if (!blocks.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
        No evidence blocks found.
      </div>
    );
  }

  return (
    <>
      <MediaDrawer
        isOpen={mediaOpen}
        mediaUrl={mediaUrl}
        mediaType={mediaType}
        mediaCaption={mediaCaption}
        onClose={() => setMediaOpen(false)}
      />
      <PdfEvidenceDrawer
        isOpen={pdfOpen}
        onClose={() => setPdfOpen(false)}
        paperId={paperId}
        doclingRefs={pdfRefs}
        title="Evidence highlight"
        highlightLabel="Evidence"
      />
      <PreviewDrawer
        isOpen={previewOpen}
        isLoading={previewLoading}
        title={previewTitle}
        summary={previewSummary}
        kind={previewKind}
        onClose={() => setPreviewOpen(false)}
      />
      <EvidenceBlocksLayout
        blocks={blocks}
        paperId={paperId}
        uploads={uploads}
        showActions={showActions}
        onPreview={openPreview}
        onOpenMedia={(type, url, caption) => {
          setMediaType(type);
          setMediaUrl(url);
          setMediaCaption(caption ?? null);
          setMediaOpen(true);
        }}
        onOpenPdf={(ref) => {
          setPdfRefs(ref ? [ref] : []);
          setPdfOpen(true);
        }}
      />
    </>
  );
}

function EvidenceBlocksLayout({
  blocks,
  paperId,
  uploads,
  showActions,
  onPreview,
  onOpenMedia,
  onOpenPdf,
}: {
  blocks: EvidenceBlock[];
  paperId: string;
  uploads: EvidenceUploads;
  showActions: boolean;
  onPreview: (kind: "paper" | "section", id?: string) => void;
  onOpenMedia: (type: "figure" | "table", url: string, caption?: string) => void;
  onOpenPdf: (ref?: string) => void;
}) {
  const [activeId, setActiveId] = useState(blocks[0]?.block_id ?? "");
  const activeBlock =
    blocks.find((block) => block.block_id === activeId) ?? blocks[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        {blocks.map((block) => {
          const isActive = block.block_id === activeId;
          return (
            <button
              key={block.block_id}
              type="button"
              onClick={() => setActiveId(block.block_id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                isActive
                  ? "border-neutral-900 bg-white shadow-sm"
                  : "border-neutral-200/70 bg-neutral-50 hover:border-neutral-300"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-neutral-900/90 px-2 py-1 text-[11px] text-white">
                    {block.type ?? "Block"}
                  </span>
                  <span>#{block.block_index ?? "N/A"}</span>
                </div>
                <span className="text-[11px] text-neutral-400">
                  Section {block.section_id ? "linked" : "—"}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-neutral-700">
                {block.text ?? "No preview available."}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-neutral-500">
                <span className="rounded-full border border-neutral-200/70 px-2 py-0.5">
                  Evidence
                </span>
                {block.docling_ref ? (
                  <span className="rounded-full border border-emerald-200/70 px-2 py-0.5 text-emerald-600">
                    PDF ready
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {activeBlock ? (
        <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-neutral-400">
                {activeBlock.type ?? "Block"} detail
              </p>
              <h4 className="mt-2 text-lg font-semibold text-neutral-900">
                Block #{activeBlock.block_index ?? "N/A"}
              </h4>
            </div>
            {showActions ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Link
                  className="rounded-full border border-neutral-200/70 px-3 py-1 text-neutral-600"
                  href={`/dashboard/blocks/${paperId}/${activeBlock.block_id}`}
                >
                  Open block
                </Link>
                {activeBlock.section_id ? (
                  <button
                    type="button"
                    className="rounded-full border border-neutral-200/70 px-3 py-1 text-neutral-600"
                    onClick={() => onPreview("section", activeBlock.section_id)}
                  >
                    Preview section
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rounded-full border border-neutral-200/70 px-3 py-1 text-neutral-600"
                  onClick={() => onPreview("paper", paperId)}
                >
                  Preview paper
                </button>
                {activeBlock.docling_ref ? (
                  <button
                    type="button"
                    className="rounded-full border border-neutral-200/70 px-3 py-1 text-neutral-600"
                    onClick={() => onOpenPdf(activeBlock.docling_ref)}
                  >
                    View in PDF
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-4">
            {activeBlock.type === "figure" || activeBlock.type === "table" ? (
              <EvidenceMedia
                block={activeBlock}
                uploads={uploads}
                onOpenMedia={onOpenMedia}
              />
            ) : (
              <p className="text-sm leading-6 text-neutral-700">
                {activeBlock.text ?? "No text available."}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EvidenceMedia({
  block,
  uploads,
  onOpenMedia,
}: {
  block: EvidenceBlock;
  uploads: EvidenceUploads;
  onOpenMedia: (type: "figure" | "table", url: string, caption?: string) => void;
}) {
  const caption = normalizeCaption(block.text ?? "");
  const upload = resolveUpload(block, uploads);

  if (!upload) {
    return (
      <p className="mt-3 text-sm text-neutral-700">
        {block.text ?? "No media available."}
      </p>
    );
  }

  if (block.type === "figure") {
    return (
      <div className="mt-3 space-y-3">

      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <TablePreview url={upload.url} />
      <button
        type="button"
        className="btn-secondary"
        onClick={() => onOpenMedia("table", upload.url, caption)}
      >
        View full
      </button>
    </div>
  );
}

function resolveUpload(block: EvidenceBlock, uploads: EvidenceUploads) {
  const source = block.source;
  const text = block.text ?? "";
  const candidates = block.type === "figure" ? uploads.figures : uploads.tables;

  const findMatch = (needle?: string) => {
    if (!needle) return null;
    const match = candidates.find((entry) => entry.path.includes(needle));
    return match ?? null;
  };

  const matchByRegex = (value: string) => {
    const tableMatch = value.match(/table_\d+\.csv/i);
    if (tableMatch) {
      const match = findMatch(tableMatch[0]);
      if (match) return match;
    }
    const figureMatch = value.match(/figure_[^\s)]+\.png/i);
    if (figureMatch) {
      const match = findMatch(figureMatch[0]);
      if (match) return match;
    }
    return null;
  };

  if (source && typeof source === "string") {
    try {
      const parsed = JSON.parse(source) as Record<string, any>;
      const keys = [
        parsed.path,
        parsed.file,
        parsed.filename,
        parsed.name,
        parsed.upload_path,
        parsed.figure_path,
        parsed.table_path,
        parsed.asset_path,
      ]
        .filter(Boolean)
        .map((value) => String(value));
      for (const key of keys) {
        const match = findMatch(key);
        if (match) return match;
        const regexMatch = matchByRegex(key);
        if (regexMatch) return regexMatch;
      }
    } catch {
      const regexMatch = matchByRegex(source);
      if (regexMatch) return regexMatch;
    }
  }

  const textMatch = matchByRegex(text);
  if (textMatch) return textMatch;

  return candidates[0] ?? null;
}

function TablePreview({ url }: { url: string }) {
  const [rows, setRows] = useState<string[][]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        if (!isMounted) return;
        const lines = text.split(/\r?\n/).slice(0, 6);
        const parsed = lines
          .filter(Boolean)
          .map((line) => line.split(",").slice(0, 6));
        setRows(parsed);
      })
      .catch(() => {
        if (isMounted) setError("Unable to load preview.");
      });
    return () => {
      isMounted = false;
    };
  }, [url]);

  if (error) {
    return <p className="text-sm text-neutral-500">{error}</p>;
  }

  if (rows.length === 0) {
    return <p className="text-sm text-neutral-500">Loading preview…</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white">
      <table className="w-full text-xs text-neutral-600">
        <tbody>
          {rows.map((row, index) => (
            <tr key={`row-${index}`} className="border-b border-neutral-200/70">
              {row.map((cell, cellIndex) => (
                <td key={`cell-${index}-${cellIndex}`} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MediaDrawer({
  isOpen,
  mediaUrl,
  mediaType,
  mediaCaption,
  onClose,
}: {
  isOpen: boolean;
  mediaUrl: string | null;
  mediaType: "figure" | "table" | null;
  mediaCaption: string | null;
  onClose: () => void;
}) {
  if (!isOpen || !mediaUrl || !mediaType) return null;

  return (
    <div className="fixed inset-0 z-45 flex items-end justify-center bg-black/30 p-4 md:items-center">
      <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-neutral-200/70 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-neutral-200/70 p-6">
          <div>
            <p className="text-xs uppercase text-neutral-400">
              {mediaType === "figure" ? "Figure" : "Table"}
            </p>
            <h3 className="text-lg font-semibold text-neutral-900">
              Full preview
            </h3>
          </div>
          <button type="button" className="btn-secondary text-xs" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="p-6">
          {mediaType === "figure" ? (
            <img
              src={mediaUrl}
              alt={mediaCaption ?? "Figure"}
              className="max-h-[70vh] w-full rounded-2xl border border-neutral-200/70 object-contain"
            />
          ) : (
            <div className="overflow-auto rounded-2xl border border-neutral-200/70">
              <TablePreview url={mediaUrl} />
              <div className="mt-4">
                <a
                  className="btn-secondary inline-flex"
                  href={mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download CSV
                </a>
              </div>
            </div>
          )}
          {mediaCaption ? (
            <p className="mt-4 text-sm text-neutral-600">{mediaCaption}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PreviewDrawer({
  isOpen,
  isLoading,
  title,
  summary,
  kind,
  onClose,
}: {
  isOpen: boolean;
  isLoading: boolean;
  title: string;
  summary: string;
  kind: "paper" | "section" | null;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-end justify-center bg-black/30 p-4 md:items-center">
      <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-neutral-200/70 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-neutral-200/70 p-6">
          <div>
            <p className="text-xs uppercase text-neutral-400">Preview</p>
            <h3 className="text-lg font-semibold text-neutral-900">
              {kind === "section" ? "Section" : "Paper"} summary
            </h3>
          </div>
          <button type="button" className="btn-secondary text-xs" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
              Loading preview...
            </div>
          ) : (
            <>
              <h4 className="text-lg font-semibold text-neutral-900">{title}</h4>
              <p className="mt-3 text-sm text-neutral-600">{summary}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function normalizeCaption(value: string) {
  if (!value) return "";
  return value.replace(/^CAPTION:\s*/i, "").trim();
}
