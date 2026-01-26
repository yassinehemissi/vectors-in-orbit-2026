interface ActivityItem {
  title: string;
  detail: string;
  time: string;
}

interface ActivityCardProps {
  items: ActivityItem[];
}

export function ActivityCard({ items }: ActivityCardProps) {
  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">Recent activity</h3>
        <button type="button" className="text-xs text-neutral-500">
          View all
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
            <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
            <p className="text-xs text-neutral-500">{item.detail}</p>
            <p className="mt-2 text-[11px] uppercase text-neutral-400">{item.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
