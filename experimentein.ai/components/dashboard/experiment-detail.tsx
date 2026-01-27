"use client";

import { useMemo, useState } from "react";
import { getBlocksByIds } from "@/storage/actions";
import Link from "next/link";

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

  const openEvidence = async (evidenceIds: string[]) => {
    setIsOpen(true);
    setIsLoading(true);
    try {
      const data = (await getBlocksByIds(paperId, evidenceIds)) as BlockRow[];
      setBlocks(data);
    } finally {
      setIsLoading(false);
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
                  {field.confidence.toFixed(2)}
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
        <EvidenceDrawer
          blocks={blocks}
          isLoading={isLoading}
          onClose={() => setIsOpen(false)}
          paperId={paperId}
        />
      ) : null}
    </div>
  );
}

function EvidenceDrawer({
  blocks,
  isLoading,
  onClose,
  paperId,
}: {
  blocks: BlockRow[];
  isLoading: boolean;
  onClose: () => void;
  paperId: string;
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
                      {block.section_id ? (
                        <Link
                          className="rounded-full border border-neutral-200/70 px-3 py-1 text-[11px] text-neutral-600"
                          href={`/dashboard/sections/${paperId}/${block.section_id}`}
                        >
                          Open section
                        </Link>
                      ) : null}
                      <Link
                        className="rounded-full border border-neutral-200/70 px-3 py-1 text-[11px] text-neutral-600"
                        href={`/dashboard/blocks/${paperId}/${block.block_id}`}
                      >
                        Open block
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
