import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { listActivityPage } from "@/storage/activity";
import Link from "next/link";

function formatRelative(value: string) {
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
}

export default async function DashboardActivityPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  searchParams = await searchParams
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return (
      <>
        <DashboardTopBar title="Activity" subtitle="Your recent actions." />
        <div className="rounded-3xl border border-dashed border-neutral-200/70 bg-white p-6 text-sm text-neutral-500 shadow-sm">
          Sign in to see activity.
        </div>
      </>
    );
  }

  await connectToDatabase();
  const user = await User.findOne({ email });
  const page = Math.max(1, Number(searchParams?.page ?? 1));
  const data = user ? await listActivityPage(user._id, page, 20) : null;

  if (!data) {
    return (
      <>
        <DashboardTopBar title="Activity" subtitle="Your recent actions." />
        <div className="rounded-3xl border border-dashed border-neutral-200/70 bg-white p-6 text-sm text-neutral-500 shadow-sm">
          No activity available.
        </div>
      </>
    );
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <>
      <DashboardTopBar title="Activity" subtitle="Your recent actions." />
      <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>
            Showing page {data.page} of {totalPages}
          </span>
          <span>{data.total} total actions</span>
        </div>
        <div className="mt-4 space-y-3">
          {data.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
              No activity yet.
            </div>
          ) : null}
          {data.items.map((item, index) => (
            <div
              key={`${item.title}-${item.time}-${index}`}
              className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {item.title}
                  </p>
                  <p className="text-xs text-neutral-500">{item.detail}</p>
                </div>
                <span className="text-xs uppercase text-neutral-400">
                  {formatRelative(item.time)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <Link
            className="btn-secondary text-xs"
            href={`/dashboard/activity?page=${Math.max(1, data.page - 1)}`}
          >
            Previous
          </Link>
          <Link
            className="btn-secondary text-xs"
            href={`/dashboard/activity?page=${Math.min(totalPages, data.page + 1)}`}
          >
            Next
          </Link>
        </div>
      </div>
    </>
  );
}
