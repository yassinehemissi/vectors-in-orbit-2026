import type { Metadata } from "next";
import DashboardSearchClient from "@/app/(auth)/dashboard/search/search-client";

export const metadata: Metadata = {
  title: "Search · Experimentein.ai",
  description: "Search items, papers, sections, and evidence in one place.",
};

export default function DashboardSearchPage() {
  return <DashboardSearchClient />;
}
