interface DashboardTopBarProps {
  title: string;
  subtitle?: string;
}

export function DashboardTopBar({ title, subtitle }: DashboardTopBarProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase text-neutral-400">Dashboard</p>
        <h1 className="font-display text-3xl font-semibold text-neutral-900">
          {title}
        </h1>
        {subtitle ? <p className="text-sm text-neutral-500">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-secondary">
          New search
        </button>
        <button type="button" className="btn-primary">
          Compare items
        </button>
      </div>
    </div>
  );
}
