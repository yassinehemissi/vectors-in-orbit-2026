"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorMessage =
    error === "OAuthAccountNotLinked"
      ? "That email is already linked to another sign-in method."
      : error === "OAuthCallback"
      ? "OAuth sign-in failed. Please try again."
      : error === "AccessDenied"
      ? "Access denied. Please try a different account."
      : error
      ? "Sign-in failed. Please try again."
      : null;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <SiteHeader />
      <main className="px-6 py-16">
        <div className="mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden rounded-[32px] border border-neutral-200/70 bg-neutral-900 p-8 text-white shadow-sm">
            <div className="absolute inset-0">
              <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-fuchsia-500/30 blur-3xl" />
              <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-cyan-400/30 blur-3xl" />
            </div>
            <div className="relative space-y-6">
              <p className="text-xs uppercase text-white/60">Experimentein.ai</p>
              <h1 className="font-display text-3xl font-semibold leading-tight">
                Welcome back to the evidence-first workspace.
              </h1>
              <p className="text-sm text-white/70">
                Sign in to continue exploring structured experiments, comparisons,
                and AI-powered insights.
              </p>
              <div className="grid gap-3 text-sm text-white/70">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Evidence stays linked, never buried.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Credits are transparent and tracked.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Compare experiments with clarity.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-neutral-200/70 bg-white p-8 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">Welcome back</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Use your email and password to continue.
            </p>
            {errorMessage ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <form className="mt-8 space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-600">Email</label>
                <input
                  type="email"
                  placeholder="you@lab.com"
                  className="mt-2 w-full rounded-2xl border border-neutral-200/70 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-600">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-2xl border border-neutral-200/70 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Continue
              </button>
            </form>

            <div className="mt-6">
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                <span className="h-px w-full bg-neutral-200/70" />
                or
                <span className="h-px w-full bg-neutral-200/70" />
              </div>
              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  className="btn-secondary w-full"
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                >
                  Continue with Google
                </button>
                <button
                  type="button"
                  className="btn-secondary w-full"
                  onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                >
                  Continue with GitHub
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-neutral-500">
              New here? <a href="/sign-up" className="text-neutral-900">Create an account</a>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
