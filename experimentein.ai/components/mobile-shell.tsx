import type { ReactNode } from "react";

interface MobileShellProps {
  children: ReactNode;
  className?: string;
}

export function MobileShell({ children, className }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div
        className={`mx-auto w-full max-w-[430px] lg:max-w-[1040px] ${className ?? ""}`}
      >
        {children}
      </div>
    </div>
  );
}
