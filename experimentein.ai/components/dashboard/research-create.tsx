"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createResearchAction } from "@/app/(auth)/dashboard/research/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Creating..." : "Create research"}
    </button>
  );
}

export function ResearchCreateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useFormState(createResearchAction, {});

  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setIsOpen(true)}>
        New research (5 credits)
      </button>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
          <div className="w-full max-w-lg rounded-[28px] border border-neutral-200/70 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-neutral-400">Create</p>
                <h3 className="text-lg font-semibold text-neutral-900">
                  New research collection
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
            <form action={formAction} className="mt-4 space-y-4">
              <div>
                <label className="text-xs uppercase text-neutral-400">
                  Title
                </label>
                <input
                  name="title"
                  placeholder="e.g. Protein stability study"
                  className="mt-2 w-full rounded-2xl border border-neutral-200/70 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase text-neutral-400">
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="Optional notes for this collection."
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
                  Research created.
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  Creating a research costs 5 credits.
                </span>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
