"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

interface SiteHeaderProps {
  onSignIn?: () => void;
}

export function SiteHeader({ onSignIn }: SiteHeaderProps) {
  const { status, data } = useSession();
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated";
  const isLanding = pathname === "/";
  const isDashboard = pathname.startsWith("/dashboard");
  const avatarUrl = data?.user?.image;
  const displayName = data?.user?.name ?? "Account";

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
      return;
    }

    signIn();
  };

  const linkClass = (href: string) =>
    `hover:text-neutral-900 ${pathname === href ? "text-neutral-900" : ""}`;

  return (
    <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
      <a className="flex items-center gap-3" href="/">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Experimentein.ai logo" className="h-full w-full object-cover" />
        </div>
        <div className="text-sm font-semibold tracking-wide text-neutral-900">
          Experimentein.ai
        </div>
      </a>
      <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex">
        <div className="group relative">
          <button
            type="button"
            className="inline-flex items-center gap-2 hover:text-neutral-900"
          >
            Product
            <span className="text-xs">▾</span>
          </button>
          <div className="absolute left-0 top-full z-20 mt-3 hidden w-48 rounded-2xl border border-neutral-200/70 bg-white p-2 shadow-lg group-hover:block group-focus-within:block">
            <a className="block rounded-xl px-3 py-2 text-sm hover:bg-neutral-50" href="/#tour">
              Product tour
            </a>
            <a className="block rounded-xl px-3 py-2 text-sm hover:bg-neutral-50" href="/#features">
              Features
            </a>
            <a className="block rounded-xl px-3 py-2 text-sm hover:bg-neutral-50" href="/#evidence">
              Evidence
            </a>
            <a className="block rounded-xl px-3 py-2 text-sm hover:bg-neutral-50" href="/#partners">
              Partners
            </a>
          </div>
        </div>
        <a className={linkClass("/pricing")} href="/pricing">
          Pricing
        </a>
        {isAuthenticated && !isDashboard ? (
          <a className={linkClass("/dashboard")} href="/dashboard">
            Dashboard
          </a>
        ) : null}
      </nav>
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-2 rounded-full border border-neutral-200/70 bg-white/80 px-3 py-1 text-xs text-neutral-600">
              <span className="h-6 w-6 overflow-hidden rounded-full bg-neutral-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </span>
              <span className="max-w-[120px] truncate">{displayName}</span>
            </div>
            <button type="button" className="btn-secondary" onClick={() => signOut()}>
              Sign out
            </button>
          </>
        ) : (
          <button type="button" className="btn-secondary" onClick={handleSignIn}>
            Sign in
          </button>
        )}
        {isAuthenticated ? (
          !isDashboard ? (
            <a className="btn-primary" href="/dashboard">
              Go to dashboard
            </a>
          ) : null
        ) : (
          <a className="btn-primary" href="/sign-up">
            Request access
          </a>
        )}
      </div>
    </header>
  );
}
