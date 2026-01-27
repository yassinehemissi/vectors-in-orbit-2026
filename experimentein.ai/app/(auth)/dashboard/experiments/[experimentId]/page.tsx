import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { getExperimentById } from "@/storage/actions";

interface ExperimentDetailPageProps {
  params: { experimentId: string };
}

export default async function ExperimentDetailPage({ params }: ExperimentDetailPageProps) {
  const experiment = await getExperimentById(params.experimentId);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <SiteHeader />
      <DashboardShell>
        <DashboardTopBar
          title="Experiment detail"
          subtitle="Evidence-linked fields and structured data."
        />
        <div className="space-y-4">
          <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">Experiment</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-900">
              {experiment?.experiment_id ?? "Experiment"}
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              {experiment?.summary ?? "No summary available yet."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: "Goal", value: experiment?.goal },
              { label: "Setup", value: experiment?.setup },
              { label: "Dataset", value: experiment?.dataset },
              { label: "Metrics", value: experiment?.metrics },
              { label: "Results", value: experiment?.results },
              { label: "Baselines", value: experiment?.baselines },
              { label: "Ablations", value: experiment?.ablations },
              { label: "Limitations", value: experiment?.limitations },
            ].map((slot) => (
              <div
                key={slot.label}
                className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm"
              >
                <p className="text-xs uppercase text-neutral-400">{slot.label}</p>
                <p className="mt-2 text-sm text-neutral-700">
                  {slot.value ? String(slot.value) : "Not found in paper"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </DashboardShell>
      <SiteFooter />
    </div>
  );
}
