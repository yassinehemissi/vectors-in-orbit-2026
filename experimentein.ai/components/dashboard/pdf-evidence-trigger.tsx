"use client";

import { useState } from "react";
import { PdfEvidenceDrawer } from "@/components/dashboard/pdf-evidence-drawer";

export function PdfEvidenceTrigger({
  paperId,
  doclingRef,
  label = "View in PDF",
  highlightLabel = "Evidence",
}: {
  paperId: string;
  doclingRef?: string | null;
  label?: string;
  highlightLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!paperId || !doclingRef) return null;

  return (
    <>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <PdfEvidenceDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        paperId={paperId}
        doclingRefs={doclingRef ? [doclingRef] : []}
        title="PDF highlight"
        highlightLabel={highlightLabel}
      />
    </>
  );
}
