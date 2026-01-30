import { redirect } from "next/navigation";

export default async function ExperimentDetailPage({
  params,
}: {
  params: { paperId: string; experimentId: string };
}) {
  const resolvedParams = await params;
  redirect(`/dashboard/items/${resolvedParams.paperId}/${resolvedParams.experimentId}`);
}
