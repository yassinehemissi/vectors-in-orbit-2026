interface MetaRowProps {
  items: Array<{ icon: string; label: string }>;
}

const iconMap: Record<string, string> = {
  calendar: "M5 5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 4h14M8 3v4M16 3v4",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z M14 3v5h5",
  sparkles: "M7 4l1.5 3L12 8.5 8.5 10 7 13 5.5 10 2 8.5 5.5 7ZM17 11l1 2 2 1-2 1-1 2-1-2-2-1 2-1Z",
  check: "M20 6 9 17l-5-5",
};

function Icon({ name }: { name: string }) {
  const path = iconMap[name] ?? iconMap.file;
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MetaRow({ items }: MetaRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-2">
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
