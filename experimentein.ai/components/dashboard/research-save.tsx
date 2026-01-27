"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveResearchItemAction } from "@/app/(auth)/dashboard/research/actions";

type ResearchCollection = {
  id: string;
  title: string;
  description: string;
  status: string;
};

type ResearchSaveButtonProps = {
  kind: "experiment" | "paper" | "section" | "block";
  itemId: string;
  paperId?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Saving..." : "Save"}
    </button>
  );
}

export function ResearchSaveButton({
  kind,
  itemId,
  paperId,
}: ResearchSaveButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [collections, setCollections] = useState<ResearchCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [state, formAction] = useFormState(saveResearchItemAction, {});

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let isMounted = true;
    setIsLoading(true);
    fetch("/api/research")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setCollections(Array.isArray(data.collections) ? data.collections : []);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const hasCollections = collections.length > 0;
  const defaultId = collections[0]?.id ?? "";

  return (
    <>
      <button type="button" className="btn-secondary" onClick={() => setIsOpen(true)}>
        Save to research
      </button>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
          <div className="w-full max-w-lg rounded-[28px] border border-neutral-200/70 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-neutral-400">Save</p>
                <h3 className="text-lg font-semibold text-neutral-900">
                  Add to research
                </h3>
              </div>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
            {isLoading ? (
              <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-500">
                Loading collections...
              </div>
            ) : null}
            {!isLoading && !hasCollections ? (
              <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-500">
                No research collections yet. Create one first.
              </div>
            ) : null}
            {!isLoading && hasCollections ? (
              <form action={formAction} className="mt-4 space-y-4">
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="itemId" value={itemId} />
                {paperId ? (
                  <input type="hidden" name="paperId" value={paperId} />
                ) : null}
                <div>
                  <label className="text-xs uppercase text-neutral-400">
                    Research collection
                  </label>
                  <select
                    name="researchId"
                    defaultValue={defaultId}
                    className="mt-2 w-full rounded-2xl border border-neutral-200/70 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none"
                    required
                  >
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase text-neutral-400">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    placeholder="Optional notes for this item."
                    className="mt-2 w-full rounded-2xl border border-neutral-200/70 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none"
                    rows={3}
                  />
                </div>
                {state?.error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    {state.error}
                  </div>
                ) : null}
                {state?.success ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                    Saved to research.
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    Item type: {kind}
                  </span>
                  <SubmitButton />
                </div>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
