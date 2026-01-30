import { redirect } from "next/navigation";
import type { Metadata } from "next";

export default function DashboardItemsPage() {
  redirect("/dashboard/search?mode=items");
}

export const metadata: Metadata = {
  title: "Items · Experimentein.ai",
  description: "Redirect to item search inside the Search page.",
};
