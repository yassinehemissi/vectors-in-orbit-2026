"use client";

import { useMemo, useState } from "react";
import { getBlocksByIds } from "@/storage/blocks"; 
import Link from "next/link";
import { getSectionById } from "@/storage/sections";
import { getPaperById } from "@/storage/papers";

type ExperimentField = {
  label: string;
  value: string;
  confidence?: number;
  evidenceIds: string[];
};

type BlockRow = {
  block_id: string;
  section_id?: string;
  text?: string;
  type?: string;
  block_index?: number;
};

interface ExperimentDetailClientProps {
  paperId: string;
  fields: ExperimentField[];
}

export function ExperimentDetailClient({
  paperId,
  fields,
}: ExperimentDetailClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewSummary, setPreviewSummary] = useState("");
  const [previewKind, setPreviewKind] = useState<"paper" | "section" | null>(
    null,
  );

  const openEvidence = async (evidenceIds: string[]) => {
    setIsOpen(true);
    setIsLoading(true);
    try {
      const data = (await getBlocksByIds(paperId, evidenceIds)) ;
      setBlocks(data as (BlockRow[] | []));
    } finally {
      setIsLoading(false);
    }
  };

  const openPreview = async (kind: "paper" | "section", id?: string) => {
    if (!id) return;
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewKind(kind);
    try {
      if (kind === "section") {
        const section = await getSectionById(paperId, id);
        setPreviewTitle(section?.title ?? section?.section_id ?? "Section");
        setPreviewSummary(section?.summary ?? "No summary available yet.");
      } else {
        const paper = await getPaperById(paperId);
        setPreviewTitle(paper?.title ?? paper?.paper_id ?? "Paper");
        setPreviewSummary(paper?.summary ?? "No summary available yet.");
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.label}
            className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-neutral-400">{field.label}</p>
                <p className="mt-2 text-sm text-neutral-700">
                  {field.value || "Not found in paper"}
                </p>
              </div>
              {field.confidence !== undefined ? (
                <span className="rounded-full border border-neutral-200/70 px-2 py-1 text-[11px] text-neutral-500">
                  {field.confidence ? field.confidence.toFixed(2): 0}
                </span>
              ) : null}
            </div>
            {field.evidenceIds.length ? (
              <button
                type="button"
                className="btn-secondary mt-4"
                onClick={() => openEvidence(field.evidenceIds)}
              >
                View evidence ({field.evidenceIds.length})
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {isOpen ? (
        <>
          <PreviewDrawer
            isOpen={previewOpen}
            isLoading={previewLoading}
            title={previewTitle}
            summary={previewSummary}
            kind={previewKind}
            onClose={() => setPreviewOpen(false)}
          />
          <EvidenceDrawer
          blocks={blocks}
          isLoading={isLoading}
          onClose={() => setIsOpen(false)}
          paperId={paperId}
          onPreview={openPreview}
        />
        </>
      ) : null}
    </div>
  );
}

function EvidenceDrawer({
  blocks,
  isLoading,
  onClose,
  paperId,
  onPreview,
}: {
  blocks: BlockRow[];
  isLoading: boolean;
  onClose: () => void;
  paperId: string;
  onPreview: (kind: "paper" | "section", id?: string) => void;
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
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-6">
          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
              Loading evidence...
            </div>
          ) : null}
          {!isLoading && blocks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
              No evidence blocks found.
            </div>
          ) : null}
          {!isLoading
            ? blocks.map((block) => (
                <div
                  key={block.block_id}
                  className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-neutral-200/70 px-2 py-1">
                        {block.type ?? "Block"}
                      </span>
                      <span>#{block.block_index ?? "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        className="rounded-full border border-neutral-200/70 px-3 py-1 text-[11px] text-neutral-600"
                        href={`/dashboard/blocks/${paperId}/${block.block_id}`}
                      >
                        Check page
                      </Link>
                      {block.section_id ? (
                        <>
                          <button
                            type="button"
                            className="rounded-full border border-neutral-200/70 px-3 py-1 text-[11px] text-neutral-600"
                            onClick={() => onPreview("section", block.section_id)}
                          >
                            Preview section
                          </button>
                          <Link
                            className="rounded-full border border-neutral-200/70 px-3 py-1 text-[11px] text-neutral-600"
                            href={`/dashboard/sections/${paperId}/${block.section_id}`}
                          >
                            Check page
                          </Link>
                        </>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-full border border-neutral-200/70 px-3 py-1 text-[11px] text-neutral-600"
                        onClick={() => onPreview("paper", paperId)}
                      >
                        Preview paper
                      </button>
                      <Link
                        className="rounded-full border border-neutral-200/70 px-3 py-1 text-[11px] text-neutral-600"
                        href={`/dashboard/papers/${paperId}`}
                      >
                        Check page
                      </Link>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-neutral-700">
                    {block.text ?? ""}
                  </p>
                </div>
              ))
            : null}
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
