interface PtsBadgeProps {
  label: string;
}

export function PtsBadge({ label }: PtsBadgeProps) {
  return (
    <span className="text-[11px] rounded-full bg-black/70 px-2 py-1 text-white">
      {label}
    </span>
  );
}
