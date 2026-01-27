interface SegmentTabsProps {
  items: string[];
  active: string;
}

export function SegmentTabs({ items, active }: SegmentTabsProps) {
  return (
    <div className="px-5">
      <div className="flex items-center gap-5 border-b border-neutral-200/70 text-sm">
        {items.map((item) => {
          const isActive = item === active;
          return (
            <button
              key={item}
              type="button"
              className={`pb-3 transition-colors ${
                isActive
                  ? "text-neutral-900 border-b-2 border-neutral-900"
                  : "text-neutral-500"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
