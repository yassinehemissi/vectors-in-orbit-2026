import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { ExperimentDetailClient } from "@/components/dashboard/experiment-detail";
import { getExperimentByKey } from "@/storage/actions";
import Link from "next/link";

interface ExperimentDetailPageProps {
  params: { paperId: string; experimentId: string };
}

export default async function ExperimentDetailPage({
  params,
}: ExperimentDetailPageProps) {
  const resolvedParams = await params;
  const experiment = await getExperimentByKey(
    resolvedParams.paperId,
    resolvedParams.experimentId,
  );

  const parseField = (label: string, rawValue?: string | null) => {
    if (!rawValue) {
      return { label, value: "", confidence: undefined, evidenceIds: [] as string[] };
    }

    if (typeof rawValue === "string") {
      try {
        const parsed = JSON.parse(rawValue) as {
          value?: string;
          confidence?: number;
          evidence_block_ids?: string[];
        };
        return {
          label,
          value: parsed.value ?? "",
          confidence: parsed.confidence,
          evidenceIds: parsed.evidence_block_ids ?? [],
        };
      } catch {
        return { label, value: rawValue, confidence: undefined, evidenceIds: [] };
      }
    }

    return { label, value: String(rawValue), confidence: undefined, evidenceIds: [] };
  };

  if (!experiment) {
    return (
      <>
        <DashboardTopBar
          title="Experiment detail"
          subtitle="Evidence-linked fields and structured data."
        />
        <div className="mt-6 rounded-3xl border border-dashed border-neutral-200/70 bg-white p-10 text-center shadow-sm">
          <p className="text-xs uppercase text-neutral-400">Not found</p>
          <h2 className="mt-3 text-2xl font-semibold text-neutral-900">
            Experiment unavailable
          </h2>
          <p className="mt-3 text-sm text-neutral-600">
            This experiment is not indexed yet or the ID does not exist.
          </p>
          <Link className="btn-secondary mt-6" href="/dashboard/search">
            Back to search
          </Link>
        </div>
      </>
    );
  }

  const fields = [
    parseField("Goal", experiment.goal),
    parseField("Setup", experiment.setup),
    parseField("Dataset", experiment.dataset),
    parseField("Metrics", experiment.metrics),
    parseField("Results", experiment.results),
    parseField("Baselines", experiment.baselines),
    parseField("Ablations", experiment.ablations),
    parseField("Limitations", experiment.limitations),
  ];

  const evidenceCount = new Set(
    fields.flatMap((field) => field.evidenceIds ?? []),
  ).size;

  return (
    <>
      <DashboardTopBar
        title="Experiment detail"
        subtitle="Evidence-linked fields and structured data."
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">Experiment</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-900">
              {experiment.title ?? experiment.experiment_id ?? "Experiment"}
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral-600">
              {experiment.summary ?? "No summary available yet."}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-neutral-400">Structured fields</p>
            <div className="mt-4">
              <ExperimentDetailClient
                paperId={resolvedParams.paperId}
                fields={fields}
              />
            </div>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">Metadata</p>
            <div className="mt-4 space-y-3 text-sm text-neutral-600">
              <div className="flex items-center justify-between gap-3">
                <span>Experiment ID</span>
                <span className="font-mono text-xs text-neutral-500">
                  {experiment.experiment_id}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Paper ID</span>
                <span className="font-mono text-xs text-neutral-500">
                  {experiment.paper_id}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Type</span>
                <span>{experiment.experiment_type ?? "N/A"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Overall confidence</span>
                <span>
                  {typeof experiment.confidence_overall === "number"
                    ? experiment.confidence_overall.toFixed(2)
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Evidence blocks</span>
                <span>{evidenceCount}</span>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">Actions</p>
            <div className="mt-4 flex flex-col gap-3">
              <Link
                className="btn-secondary"
                href={`/dashboard/papers/${experiment.paper_id}`}
              >
                View paper
              </Link>
              <Link className="btn-secondary" href="/dashboard/search">
                Search related content
              </Link>
              <Link className="btn-primary" href="/dashboard/experiments">
                Explore experiments
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
