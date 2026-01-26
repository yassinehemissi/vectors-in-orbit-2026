import type { ReactNode } from "react";

interface AppHeaderProps {
  name: string;
  avatarUrl?: string;
  children?: ReactNode;
}

export function AppHeader({ name, avatarUrl, children }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-3">
      <div>
        <p className="text-sm text-neutral-500">Welcome,</p>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {name}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {children}
        <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-200">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={`${name} avatar`}
              src={avatarUrl}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
