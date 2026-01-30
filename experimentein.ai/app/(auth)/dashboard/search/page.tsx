import type { Metadata } from "next";
import { Suspense } from "react";
import DashboardSearchClient from "@/app/(auth)/dashboard/search/search-client";

export const metadata: Metadata = {
  title: "Search · Experimentein.ai",
  description: "Search items, papers, sections, and evidence in one place.",
};

export default function DashboardSearchPage() {
  return (
    <Suspense fallback={null}>
      <DashboardSearchClient />
    </Suspense>
  );
}
