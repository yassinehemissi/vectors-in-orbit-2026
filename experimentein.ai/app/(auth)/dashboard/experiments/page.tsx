import { redirect } from "next/navigation";

export default async function DashboardExperimentsPage() {
  redirect("/dashboard/items");
}
