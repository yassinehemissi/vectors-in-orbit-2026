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
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-gradient-to-br from-fuchsia-400/40 via-indigo-300/40 to-cyan-300/40 blur-3xl" />
          <div className="absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-sky-300/40 via-emerald-200/40 to-cyan-200/40 blur-3xl animate-float-slow" />
          <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-200/50 via-fuchsia-200/40 to-amber-200/40 blur-3xl" />
        </div>

        <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Experimentein.ai logo" className="h-full w-full object-cover" />
            </div>
            <div className="text-sm font-semibold tracking-wide text-neutral-900">
              Experimentein.ai
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex">
            <a className="hover:text-neutral-900" href="#tour">
              Product tour
            </a>
            <a className="hover:text-neutral-900" href="#features">
              Features
            </a>
            <a className="hover:text-neutral-900" href="#evidence">
              Evidence
            </a>
            <a className="hover:text-neutral-900" href="#partners">
              Partners
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="hidden rounded-full border border-neutral-200/70 bg-white/80 px-4 py-2 text-sm text-neutral-700 shadow-sm backdrop-blur md:inline-flex"
            >
              Request access
            </button>
            <button
              type="button"
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-white shadow-sm"
            >
              Launch demo
            </button>
          </div>
        </header>

        <section className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 pb-20 pt-16 md:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/70 bg-white/70 px-3 py-1 text-xs text-neutral-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Evidence-first science intelligence
            </div>
            <h1 className="font-display text-5xl font-semibold tracking-tight text-neutral-900 md:text-6xl">
              A luminous control room for scientific discovery.
            </h1>
            <p className="max-w-xl text-base text-neutral-600 md:text-lg">
              Experimentein.ai turns dense papers into cinematic experiment cards so
              teams can read, compare, and decide with confidence.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full bg-neutral-900 px-5 py-2 text-sm text-white shadow-sm"
              >
                Start exploring
              </button>
              <button
                type="button"
                className="rounded-full border border-neutral-200/70 bg-white/80 px-5 py-2 text-sm text-neutral-700 shadow-sm backdrop-blur"
              >
                Watch product tour
              </button>
            </div>
            <div className="grid gap-3 pt-4 text-sm text-neutral-500 md:grid-cols-3">
              {heroSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-2xl border border-neutral-200/70 bg-white/80 p-4 shadow-sm"
                >
                  <p className="text-xs uppercase text-neutral-400">{signal.label}</p>
                  <p className="text-lg font-semibold text-neutral-900">{signal.value}</p>
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
                  <p className="text-xs uppercase text-neutral-400">Featured experiment</p>
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
                <button
                  type="button"
                  className="rounded-full bg-neutral-900 px-3 py-1 text-xs text-white"
                >
                  View evidence
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-neutral-200/70 bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase text-neutral-400">Compare mode</p>
                <h3 className="mt-2 text-lg font-semibold text-neutral-900">
                  Align experiments side-by-side
                </h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Highlight conflicts and missing fields instantly with evidence on demand.
                </p>
              </div>
              <div className="rounded-3xl border border-neutral-200/70 bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase text-neutral-400">Protein bundle</p>
                <h3 className="mt-2 text-lg font-semibold text-neutral-900">
                  Optional enrichment layers
                </h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Enrich only when proteins are detected, with graceful fallbacks.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="tour" className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-neutral-500">Product tour</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-neutral-900">
              A guided flow from question to clarity.
            </h2>
          </div>
          <p className="max-w-md text-sm text-neutral-500">
            A calm, curated sequence that lets anyone navigate experiments without
            jargon or overload.
          </p>
        </div>
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4 pt-2 hide-scrollbar">
          {tourStops.map((stop, index) => (
            <div
              key={stop.title}
              className="min-w-[240px] snap-start rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-xs uppercase text-neutral-400">Step {index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold text-neutral-900">{stop.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{stop.description}</p>
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
            The platform keeps discovery clear, decisions grounded, and AI actions
            transparent.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-neutral-900">{card.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{card.description}</p>
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
              <p className="text-xs uppercase text-neutral-400">Evidence drawer</p>
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
                { title: "Goal", status: "Found in paper", confidence: "0.86" },
                { title: "Setup", status: "Found in paper", confidence: "0.79" },
                { title: "Dataset", status: "Not found in paper", confidence: "--" },
                { title: "Metrics", status: "Found in paper", confidence: "0.82" },
              ].map((slot) => (
                <div
                  key={slot.title}
                  className="flex items-center justify-between rounded-2xl border border-neutral-200/70 bg-white p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{slot.title}</p>
                    <p className="text-xs text-neutral-500">{slot.status}</p>
                  </div>
                  <div className="text-xs text-neutral-500">
                    Confidence: <span className="text-neutral-900">{slot.confidence}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-6 w-full rounded-full bg-neutral-900 px-4 py-2 text-sm text-white"
            >
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
            <button
              type="button"
              className="rounded-full border border-neutral-200/70 bg-neutral-50 px-4 py-2 text-sm text-neutral-700"
            >
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
              <button
                type="button"
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-neutral-900"
              >
                Request access
              </button>
              <button
                type="button"
                className="rounded-full border border-white/30 px-5 py-2 text-sm text-white"
              >
                See pricing
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200/70 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-neutral-500 md:flex-row md:items-center md:justify-between">
          <p>Experimentein.ai MVP - evidence-first science intelligence.</p>
          <div className="flex gap-4">
            <a className="hover:text-neutral-900" href="/privacy-policy">
              Privacy
            </a>
            <a className="hover:text-neutral-900" href="/terms-of-service">
              Terms
            </a>
            <a className="hover:text-neutral-900" href="/contact">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
