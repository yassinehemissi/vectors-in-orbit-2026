import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { ExperimentDetailClient } from "@/components/dashboard/experiment-detail";
import { getExperimentByKey } from "@/storage/experiments";
import Link from "next/link";
import { ResearchSaveButton } from "@/components/dashboard/research-save";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/models/User";
import { logActivity } from "@/storage/activity";

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

  const parseField = (
    label: string,
    value?: string,
    evidenceIds: string[] = [],
    confidence?: number
  ) => ({
    label,
    value: value ?? "",
    confidence,
    evidenceIds,
  });

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

  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (email) {
      await connectToDatabase();
      const user = await User.findOne({ email });
      if (user) {
        await logActivity({
          userId: user._id,
          title: "Viewed experiment",
          detail: experiment.label ?? experiment.item_id ?? "Experiment",
          type: "experiment_view",
          metadata: {
            paperId: experiment.paper_id,
            experimentId: experiment.item_id,
          },
        });
      }
    }
  } catch {
    // do not block page render on activity logging
  }

  const experimentJson = (() => {
    if (!experiment.item_json) return null;
    if (typeof experiment.item_json !== "string") return null;
    try {
      return JSON.parse(experiment.item_json) as Record<string, any>;
    } catch {
      return null;
    }
  })();

  const sourceBlocks = Array.isArray(experimentJson?.source_block_ids)
    ? (experimentJson?.source_block_ids as string[])
    : [];

  const fields = [
    parseField("Label", experiment.label ?? experimentJson?.label),
    parseField("Summary", experiment.summary ?? experimentJson?.summary),
    parseField(
      "Confidence overall",
      typeof experiment.confidence_overall === "number"
        ? experiment.confidence_overall.toFixed(2)
        : experimentJson?.confidence_overall?.toString()
    ),
    parseField(
      "Candidate ID",
      experimentJson?.candidate_id ? String(experimentJson.candidate_id) : ""
    ),
    parseField(
      "Anchors",
      Array.isArray(experimentJson?.anchors)
        ? (experimentJson.anchors as string[]).join(", ")
        : ""
    ),
    parseField(
      "Predicted sections",
      Array.isArray(experimentJson?.predicted_source_sections)
        ? (experimentJson.predicted_source_sections as string[]).join(", ")
        : ""
    ),
    parseField(
      "Evidence hints",
      Array.isArray(experimentJson?.evidence_hints)
        ? (experimentJson.evidence_hints as string[]).join(", ")
        : ""
    ),
    parseField(
      "Source blocks",
      sourceBlocks.length ? `${sourceBlocks.length} blocks` : "None",
      sourceBlocks
    ),
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
              {experiment.label ?? experimentJson?.label ?? experiment.item_id ?? "Experiment"}
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral-600">
              {experiment.summary ?? experimentJson?.summary ?? "No summary available yet."}
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
                <span>Item kind</span>
                <span>{experiment.item_kind ?? "experiment"}</span>
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
              <ResearchSaveButton
                kind="experiment"
                itemId={experiment.item_id}
                paperId={experiment.paper_id}
              />
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
