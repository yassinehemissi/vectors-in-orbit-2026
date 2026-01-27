import { redirect } from "next/navigation";

export default async function SavedResearchRedirectPage({
  params,
}: {
  params: { researchId: string };
}) {
  params = await params;
  redirect(`/dashboard/research/${params.researchId}`);
}
