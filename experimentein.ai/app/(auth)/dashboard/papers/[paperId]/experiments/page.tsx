import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { listExperimentsByPaper, getExperimentSummary, getExperimentTitle } from "@/storage/experiments";
import { getPaperById } from "@/storage/papers";
import Link from "next/link";

export default async function PaperExperimentsPage({
  params,
}: {
  params: { paperId: string };
}) {
  const resolvedParams = await params;
  const experiments = await listExperimentsByPaper(resolvedParams.paperId);
  const paper = await getPaperById(resolvedParams.paperId);

  return (
    <>
      <DashboardTopBar
        title="Related experiments"
        subtitle="All experiments linked to this paper."
      />
      <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-neutral-400">Paper</p>
            <h3 className="mt-2 text-lg font-semibold text-neutral-900">
              {paper?.title ?? "Untitled paper"}
            </h3>
          </div>
          <Link className="btn-secondary text-xs" href={`/dashboard/papers/${resolvedParams.paperId}`}>
            Back to paper
          </Link>
        </div>
        {experiments.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
            No experiments found for this paper yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {experiments.map((experiment) => (
              <div
                key={`${experiment.paper_id}-${experiment.item_id}`}
                className="rounded-3xl border border-neutral-200/70 bg-neutral-50 p-6"
              >
                <p className="text-xs uppercase text-neutral-400">Experiment</p>
                <h3 className="mt-2 text-lg font-semibold text-neutral-900">
                  {getExperimentTitle(experiment)}
                </h3>
                <p className="mt-2 text-xs text-neutral-500">
                  {getExperimentSummary(experiment) ?? "No description available."}
                </p>
                <Link
                  className="btn-secondary mt-4 inline-flex"
                  href={`/dashboard/experiments/${experiment.paper_id}/${experiment.item_id}`}
                >
                  Open experiment
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
