"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { label: "Overview", href: "/dashboard" },
      { label: "Search", href: "/dashboard/search" },
      { label: "Items", href: "/dashboard/items" },
      { label: "Activity", href: "/dashboard/activity" },
      { label: "Research", href: "/dashboard/research" },
      { label: "Credits", href: "/dashboard/credits" },
    ],
    []
  );

  const activeItems = navItems.map((item) => ({
    ...item,
    active: pathname === item.href,
  }));

  return (
    <>
      <main className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-16 pt-10 lg:grid-cols-[260px_1fr]">
        <div className="hidden lg:block">
          <DashboardSidebar items={activeItems} />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between lg:hidden">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsSidebarOpen(true)}
            >
              Menu
            </button>
            <span className="text-xs uppercase text-neutral-400">Dashboard</span>
          </div>
          {children}
        </div>
      </main>

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-black/40 p-4 lg:hidden">
          <div className="h-full max-w-xs">
            <DashboardSidebar
              items={activeItems}
              onNavigate={() => setIsSidebarOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
