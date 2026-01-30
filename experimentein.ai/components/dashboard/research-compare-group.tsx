"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ResearchCompareItem = {
  id: string;
  itemId: string;
  paperId?: string;
  title: string;
  notes?: string;
};

const itemKindLabel = (value?: string) => {
  if (!value) return "Item";
  if (value === "experiment") return "Study";
  if (value === "items") return "Item";
  if (value === "item") return "Item";
  return value.replace(/_/g, " ");
};

export function ResearchCompareGroup({
  researchId,
  label,
  kind,
  items,
}: {
  researchId: string;
  label: string;
  kind?: string;
  items: ResearchCompareItem[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const compareHref = useMemo(() => {
    if (selected.length < 2) return "";
    return `/dashboard/research/${researchId}/compare?ids=${encodeURIComponent(
      selected.join(","),
    )}`;
  }, [researchId, selected]);

  return (
    <section className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-neutral-400">Group</p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900">{label}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>{items.length} items</span>
          <button
            type="button"
            className="btn-primary text-xs"
            disabled={selected.length < 2}
            onClick={() => {
              if (!compareHref) return;
              router.push(compareHref);
            }}
          >
            Compare ({selected.length})
          </button>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-500">
          Nothing added yet.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 transition ${
                selected.includes(item.id)
                  ? "border-neutral-900 bg-neutral-100"
                  : "border-neutral-200/70 bg-neutral-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-neutral-400">
                    {itemKindLabel(kind ?? label.toLowerCase())}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-neutral-900">
                    {item.title}
                  </p>
                  {item.notes ? (
                    <p className="mt-2 text-xs text-neutral-500">
                      {item.notes}
                    </p>
                  ) : null}
                </div>
                <label className="flex items-center gap-2 text-xs text-neutral-500">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300"
                    checked={selected.includes(item.id)}
                    onChange={() => toggleItem(item.id)}
                  />
                  Select
                </label>
              </div>
              {item.paperId ? (
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    className="rounded-full border border-neutral-200/70 px-3 py-1 text-[11px] text-neutral-600"
                    href={`/dashboard/items/${item.paperId}/${item.itemId}`}
                  >
                    Open
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
      {selected.length >= 2 ? (
        <div className="mt-4 text-xs text-neutral-500">
          Comparing {selected.length} items.
        </div>
      ) : null}
      {compareHref ? (
        <Link className="sr-only" href={compareHref}>
          Compare
        </Link>
      ) : null}
    </section>
  );
}
