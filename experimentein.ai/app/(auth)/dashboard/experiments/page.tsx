import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { listRecentActivity } from "@/storage/activity";
import { getExperimentByKey } from "@/storage/actions";
import Link from "next/link";

type ExperimentCard = {
  paperId: string;
  experimentId: string;
  title: string;
  detail?: string;
};

export default async function DashboardExperimentsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  let experiments: ExperimentCard[] = [];

  if (email) {
    await connectToDatabase();
    const user = await User.findOne({ email });

    if (user) {
      const activity = await listRecentActivity(user._id, 12, "experiment_view");
      const unique = new Map<string, ExperimentCard>();

      for (const item of activity) {
        const meta = item.metadata as
          | { paperId?: string; experimentId?: string }
          | undefined;
        const paperId = meta?.paperId;
        const experimentId = meta?.experimentId;
        if (!paperId || !experimentId) continue;
        const key = `${paperId}:${experimentId}`;
        if (unique.has(key)) continue;
        const experiment = await getExperimentByKey(paperId, experimentId);
        if (!experiment) continue;
        unique.set(key, {
          paperId,
          experimentId,
          title: experiment.title ?? experiment.experiment_id ?? "Experiment",
          detail: item.detail,
        });
      }

      experiments = Array.from(unique.values());
    }
  }

  return (
    <>
      <DashboardTopBar
        title="Experiments"
        subtitle="Recent experiment activity and saved work."
      />
      <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-neutral-400">Recent activity</p>
            <h3 className="mt-2 text-lg font-semibold text-neutral-900">
              Recently viewed experiments
            </h3>
          </div>
          <Link className="btn-secondary text-xs" href="/dashboard/search">
            New search
          </Link>
        </div>
        {experiments.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
            No recent experiment activity yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {experiments.map((experiment) => (
              <div
                key={`${experiment.paperId}-${experiment.experimentId}`}
                className="rounded-3xl border border-neutral-200/70 bg-neutral-50 p-6"
              >
                <p className="text-xs uppercase text-neutral-400">Experiment</p>
                <h3 className="mt-2 text-lg font-semibold text-neutral-900">
                  {experiment.title}
                </h3>
                {experiment.detail ? (
                  <p className="mt-2 text-xs text-neutral-500">
                    {experiment.detail}
                  </p>
                ) : null}
                <Link
                  className="btn-secondary mt-4 inline-flex"
                  href={`/dashboard/experiments/${experiment.paperId}/${experiment.experimentId}`}
                >
                  Open card
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
