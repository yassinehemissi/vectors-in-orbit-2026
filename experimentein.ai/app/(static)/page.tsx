"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const tourStops = [
  {
    title: "Discover",
    description: "Search papers and experiments with natural language prompts.",
    highlight: "Search by intent",
  },
  {
    title: "Inspect",
    description: "Open structured cards with every claim anchored to evidence.",
    highlight: "Evidence-linked",
  },
  {
    title: "Compare",
    description: "Line up experiments and surface differences instantly.",
    highlight: "Side-by-side",
  },
  {
    title: "Enrich",
    description: "Trigger optional AI actions when you need deeper insight.",
    highlight: "On-demand",
  },
  {
    title: "Track",
    description: "Keep credits, usage, and outcomes transparent for teams.",
    highlight: "Clear billing",
  },
];

const featureCards = [
  {
    title: "Evidence-first discovery",
    description:
      "Find experiments by intent, then jump directly into the proof behind every claim.",
  },
  {
    title: "Experiment-grade summaries",
    description:
      "Structured cards keep goals, setups, metrics, and results readable at a glance.",
  },
  {
    title: "Confidence you can feel",
    description:
      "Every slot carries confidence and citations so nothing feels hand-wavy.",
  },
  {
    title: "Compare in one sweep",
    description:
      "Align experiments side-by-side to spot deltas, conflicts, and gaps instantly.",
  },
  {
    title: "Protein-aware enrichment",
    description:
      "Optional bundles appear only when proteins are detected, with graceful fallbacks.",
  },
  {
    title: "Credit-safe AI",
    description:
      "Paid actions are transparent and measurable so teams stay in control.",
  },
];

const heroSignals = [
  { label: "Papers indexed", value: "12k+" },
  { label: "Evidence-linked fields", value: "100%" },
  { label: "Tokens per credit", value: "1,000" },
];

const partnerLogos = [
  { name: "MongoDB", file: "mongodb.png" },
  { name: "Astra DB", file: "astra.png" },
  { name: "Qdrant", file: "qdrant.png" },
  { name: "OpenRouter", file: "openrouter.svg" },
];

export default function Home() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="relative overflow-hidden">
        <div className="fixed inset-0 z-0">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-gradient-to-br from-fuchsia-400/40 via-indigo-300/40 to-cyan-300/40 blur-3xl" />
          <div className="absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-sky-300/40 via-emerald-200/40 to-cyan-300/40 blur-3xl animate-float-slow" />
          <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-200/50 via-fuchsia-200/40 to-amber-200/40 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.08),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(0,0,0,0.06),transparent_40%)]" />
        </div>

        <SiteHeader onSignIn={() => setIsSignInOpen(true)} />

        <section className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 pb-20 pt-16 md:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/70 bg-white/70 px-3 py-1 text-xs text-neutral-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Evidence-first science intelligence
            </div>
            <h1 className="font-display text-5xl font-semibold tracking-tight text-neutral-900 md:text-6xl">
              Bold, precise, and built for scientific velocity.
            </h1>
            <p className="max-w-xl text-base text-neutral-600 md:text-lg">
              Experimentein.ai transforms dense research into bold experiment
              cards so teams can decide faster without losing the evidence.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-primary">
                Start exploring
              </button>
              <button type="button" className="btn-secondary">
                Watch product tour
              </button>
            </div>
            <div className="grid gap-3 pt-4 text-sm text-neutral-500 md:grid-cols-3">
              {heroSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-2xl border border-neutral-200/70 bg-white/80 p-4 shadow-sm"
                >
                  <p className="text-xs uppercase text-neutral-400">
                    {signal.label}
                  </p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {signal.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-[36px] border border-neutral-200/70 bg-white/90 p-6 shadow-md backdrop-blur animate-fade-up">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-fuchsia-500/30 via-indigo-400/30 to-cyan-400/30 blur-xl" />
              <div className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-300/30 via-sky-300/30 to-cyan-300/30 blur-2xl" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-neutral-400">
                    Featured experiment
                  </p>
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Protein stability shift in glycolytic mutants
                  </h2>
                </div>
                <span className="rounded-full bg-black/70 px-2 py-1 text-[11px] text-white">
                  300 pts
                </span>
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  "Goal: Boost thermal stability in glycolytic mutants.",
                  "Setup: CRISPRa induction, 48h window.",
                  "Metrics: Protein half-life, folding efficiency.",
                  "Results: Stability improved by 1.8x vs baseline.",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-3 text-sm text-neutral-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between text-xs text-neutral-500">
                <span>Evidence blocks linked</span>
                <button type="button" className="btn-primary px-3 py-1 text-xs">
                  View evidence
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-neutral-200/70 bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase text-neutral-400">
                  Compare mode
                </p>
                <h3 className="mt-2 text-lg font-semibold text-neutral-900">
                  Align experiments side-by-side
                </h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Highlight conflicts and missing fields instantly with evidence
                  on demand.
                </p>
              </div>
              <div className="rounded-3xl border border-neutral-200/70 bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase text-neutral-400">
                  Protein bundle
                </p>
                <h3 className="mt-2 text-lg font-semibold text-neutral-900">
                  Optional enrichment layers
                </h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Enrich only when proteins are detected, with graceful
                  fallbacks.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div className="relative z-10">
        <section id="tour" className="mx-auto w-full max-w-6xl px-6 pb-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-neutral-500">Product tour</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-neutral-900">
                A guided flow from question to clarity.
              </h2>
            </div>
            <p className="max-w-md text-sm text-neutral-500">
              A calm, curated sequence that lets anyone navigate experiments
              without jargon or overload.
            </p>
          </div>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-4 pt-2 hide-scrollbar">
            {tourStops.map((stop, index) => (
              <div
                key={stop.title}
                className="min-w-[240px] snap-start rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <p className="text-xs uppercase text-neutral-400">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-neutral-900">
                  {stop.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-600">
                  {stop.description}
                </p>
                <div className="mt-4 inline-flex items-center rounded-full bg-neutral-900 px-3 py-1 text-xs text-white">
                  {stop.highlight}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-6xl px-6 pb-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-neutral-500">Platform features</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-neutral-900">
                Built for evidence-first science
              </h2>
            </div>
            <p className="max-w-md text-sm text-neutral-500">
              The platform keeps discovery clear, decisions grounded, and AI
              actions transparent.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-neutral-900">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-600">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="evidence" className="mx-auto w-full max-w-6xl px-6 pb-20">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <p className="text-sm text-neutral-500">Evidence tracing</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-neutral-900">
                Every claim anchored to a block.
              </h2>
              <p className="text-sm text-neutral-600">
                Experimentein.ai never invents missing fields. It shows what was
                found, what was not, and where it came from.
              </p>
              <div className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase text-neutral-400">
                  Evidence drawer
                </p>
                <ul className="mt-3 space-y-3 text-sm text-neutral-600">
                  <li className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-3">
                    Methods section, block 12 - setup details and reagents
                  </li>
                  <li className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-3">
                    Results section, block 7 - 1.8x stability improvement
                  </li>
                  <li className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-3">
                    Supplement figure, block 3 - confidence baseline
                  </li>
                </ul>
              </div>
            </div>
            <div className="rounded-[32px] border border-neutral-200/70 bg-gradient-to-br from-white via-white to-sky-50 p-6 shadow-sm">
              <div className="grid gap-4">
                {[
                  {
                    title: "Goal",
                    status: "Found in paper",
                    confidence: "0.86",
                  },
                  {
                    title: "Setup",
                    status: "Found in paper",
                    confidence: "0.79",
                  },
                  {
                    title: "Dataset",
                    status: "Not found in paper",
                    confidence: "--",
                  },
                  {
                    title: "Metrics",
                    status: "Found in paper",
                    confidence: "0.82",
                  },
                ].map((slot) => (
                  <div
                    key={slot.title}
                    className="flex items-center justify-between rounded-2xl border border-neutral-200/70 bg-white p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {slot.title}
                      </p>
                      <p className="text-xs text-neutral-500">{slot.status}</p>
                    </div>
                    <div className="text-xs text-neutral-500">
                      Confidence:{" "}
                      <span className="text-neutral-900">
                        {slot.confidence}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="btn-primary mt-6 w-full">
                Fill missing fields (120 pts)
              </button>
            </div>
          </div>
        </section>

        <section id="partners" className="mx-auto w-full max-w-6xl px-6 pb-20">
          <div className="rounded-[32px] border border-neutral-200/70 bg-white p-8 shadow-sm md:p-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-neutral-500">Partners</p>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-neutral-900">
                  Trusted infrastructure behind the platform.
                </h2>
              </div>
              <button type="button" className="btn-secondary">
                View integrations
              </button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {partnerLogos.map((partner) => (
                <div
                  key={partner.name}
                  className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-neutral-200/70 bg-neutral-50 px-6 py-8 text-sm font-semibold text-neutral-700"
                >
                  <div className="flex h-14 w-32 items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/partners/${partner.file}`}
                      alt={`${partner.name} logo`}
                      className="max-h-12 w-auto object-contain"
                    />
                  </div>
                  <span>{partner.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <div className="rounded-[32px] border border-neutral-200/70 bg-neutral-900 p-8 text-white shadow-sm md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-white/70">Ready to explore</p>
                <h2 className="font-display text-3xl font-semibold tracking-tight">
                  Bring evidence to the center of your workflow.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5"
                  href="/sign-up"
                >
                  Request access
                </a>
                <a
                  className="rounded-full border border-white/30 px-5 py-2 text-sm text-white transition hover:-translate-y-0.5"
                  href="/pricing"
                >
                  See pricing
                </a>
              </div>
            </div>
          </div>
        </section>

        <SiteFooter />

        {isSignInOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-neutral-200/70 bg-white shadow-xl">
              <div className="grid md:grid-cols-[1fr_1.1fr]">
                <div className="relative hidden h-full flex-col justify-between bg-neutral-900 p-6 text-white md:flex">
                  <div className="absolute inset-0">
                    <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-fuchsia-500/30 blur-2xl" />
                    <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-cyan-400/30 blur-2xl" />
                  </div>
                  <div className="relative space-y-3">
                    <p className="text-xs uppercase text-white/60">
                      Experimentein.ai
                    </p>
                    <h2 className="font-display text-2xl font-semibold">
                      Sign in to keep evidence close.
                    </h2>
                    <p className="text-xs text-white/70">
                      Compare, enrich, and track research faster.
                    </p>
                  </div>
                  <div className="relative rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                    Structured experiments. Zero guesswork.
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-neutral-400">
                        Welcome back
                      </p>
                      <h3 className="font-display text-2xl font-semibold text-neutral-900">
                        Sign in
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-neutral-200/70 px-3 py-1 text-xs text-neutral-600"
                      onClick={() => setIsSignInOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                  <form className="mt-5 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-neutral-600">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="you@lab.com"
                        className="mt-2 w-full rounded-2xl border border-neutral-200/70 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-600">
                        Password
                      </label>
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
                  <div className="mt-4">
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span className="h-px w-full bg-neutral-200/70" />
                      or
                      <span className="h-px w-full bg-neutral-200/70" />
                    </div>
                    <div className="mt-3 grid gap-3">
                      <button
                        type="button"
                        className="btn-secondary w-full"
                        onClick={() =>
                          signIn("google", { callbackUrl: "/dashboard" })
                        }
                      >
                        Continue with Google
                      </button>
                      <button
                        type="button"
                        className="btn-secondary w-full"
                        onClick={() =>
                          signIn("github", { callbackUrl: "/dashboard" })
                        }
                      >
                        Continue with GitHub
                      </button>
                    </div>
                  </div>
                  <p className="mt-4 text-center text-xs text-neutral-500">
                    New here?{" "}
                    <a href="/sign-up" className="text-neutral-900">
                      Create an account
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
