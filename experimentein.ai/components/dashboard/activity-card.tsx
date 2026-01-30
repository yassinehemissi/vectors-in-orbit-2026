interface ActivityItem {
  title: string;
  detail: string;
  time: string;
}

interface ActivityCardProps {
  items: ActivityItem[];
}

export function ActivityCard({ items }: ActivityCardProps) {
  const formatRelative = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} months ago`;
    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} years ago`;
  };

  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">Recent activity</h3>
        <a className="btn-secondary text-xs" href="/dashboard/activity">
          View all
        </a>
      </div>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div
            key={`${item.title}-${item.time}`}
            className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-neutral-900" />
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {item.title}
                </p>
                <p className="text-xs text-neutral-500">{item.detail}</p>
                <p className="mt-2 text-[11px] uppercase text-neutral-400">
                  {formatRelative(item.time)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
