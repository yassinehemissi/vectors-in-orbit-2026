import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Related Items · Experimentein.ai",
  description: "Related items for this paper.",
};

export default async function PaperExperimentsPage({
  params,
}: {
  params: { paperId: string };
}) {
  redirect("/dashboard/items");
}
