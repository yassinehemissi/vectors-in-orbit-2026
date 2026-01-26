import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <SiteHeader />
      <main className="px-6 py-16">
        <div className="mx-auto w-full max-w-4xl rounded-[32px] border border-neutral-200/70 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase text-neutral-400">Pricing</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
            Simple, transparent credits
          </h1>
          <p className="mt-4 text-sm text-neutral-600">
            Credit plans will be announced soon. For now, request access to join the
            early program.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-neutral-200/70 bg-neutral-50 p-6">
              <p className="text-xs uppercase text-neutral-400">Starter</p>
              <h2 className="mt-2 text-2xl font-semibold text-neutral-900">Free</h2>
              <p className="mt-2 text-sm text-neutral-600">Explore experiments and evidence.</p>
            </div>
            <div className="rounded-3xl border border-neutral-200/70 bg-neutral-50 p-6">
              <p className="text-xs uppercase text-neutral-400">Pro</p>
              <h2 className="mt-2 text-2xl font-semibold text-neutral-900">Coming soon</h2>
              <p className="mt-2 text-sm text-neutral-600">Unlock premium AI actions.</p>
            </div>
          </div>
          <div className="mt-8">
            <a className="btn-primary" href="/sign-up">
              Request access
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

