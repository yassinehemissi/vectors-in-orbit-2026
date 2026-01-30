"use client";

import { useState } from "react";
import { getBlocksByIds } from "@/storage/blocks";
import { getPaperUploads } from "@/storage/papers-data";
import { EvidenceDrawer, type EvidenceBlock, type EvidenceUploads } from "@/components/dashboard/evidence-blocks";

type ExperimentField = {
  label: string;
  value: string;
  confidence?: number;
  evidenceIds: string[];
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
  const [blocks, setBlocks] = useState<EvidenceBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploads, setUploads] = useState<EvidenceUploads>({
    figures: [],
    tables: [],
  });

  const openEvidence = async (evidenceIds: string[]) => {
    setIsOpen(true);
    setIsLoading(true);
    try {
      const data = (await getBlocksByIds(
        paperId,
        evidenceIds,
      )) as EvidenceBlock[];
      setBlocks(data);
      const media = await getPaperUploads(paperId);
      setUploads(media);
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
        <EvidenceDrawer
          isOpen={isOpen}
          blocks={blocks}
          isLoading={isLoading}
          onClose={() => setIsOpen(false)}
          paperId={paperId}
          uploads={uploads}
        />
      ) : null}
    </div>
  );
}
