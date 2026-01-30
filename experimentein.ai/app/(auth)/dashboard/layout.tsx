import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SiteHeader } from "@/components/site-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard · Experimentein.ai",
  description: "Your research command center for evidence-led exploration.",
};

const DashbordLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <SiteHeader />
      <DashboardShell>{children}</DashboardShell>
    </div>
  );
};

export default DashbordLayout;
