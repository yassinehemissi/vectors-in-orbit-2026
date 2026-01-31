import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { AgentHistoryPanel } from "@/components/dashboard/agent-history-panel";

export const metadata = {
  title: "Agent Conversations · Experimentein.ai",
  description: "Review and manage your AI agent conversations.",
};

export default function AgentHistoryPage() {
  return (
    <>
      <DashboardTopBar
        title="Agent conversations"
        subtitle="Browse, rename, delete, and resume past chats."
      />
      <AgentHistoryPanel />
    </>
  );
}
