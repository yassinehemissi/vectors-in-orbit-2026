interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
}

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-neutral-900">{value}</p>
      {helper ? <p className="mt-1 text-xs text-neutral-500">{helper}</p> : null}
    </div>
  );
}
