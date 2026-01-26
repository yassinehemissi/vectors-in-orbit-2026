import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <SiteHeader />
      <main className="px-6 py-16">
        <div className="mx-auto w-full max-w-3xl rounded-[32px] border border-neutral-200/70 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase text-neutral-400">Terms of Service</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-neutral-500">Last updated: {new Date("1-27-2026").toUTCString()}</p>

          <div className="mt-8 space-y-6 text-sm text-neutral-600">
            <p>
              By accessing or using Experimentein.ai (Experimentein), you agree to the
              following terms.
            </p>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">1. Purpose of the Service</h2>
              <p className="mt-2">
                Experimentein is a research and analysis tool that:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Indexes public scientific literature</li>
                <li>Extracts and summarizes experiments</li>
                <li>Provides semantic search and AI-assisted analysis</li>
              </ul>
              <p className="mt-2">
                The service is provided for informational and research purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">
                2. No Medical or Scientific Advice
              </h2>
              <p className="mt-2">
                Experimentein does not provide medical advice, clinical
                recommendations, or safety guarantees.
              </p>
              <p className="mt-2">
                All outputs are generated from public research and automated systems.
                Users are responsible for verifying results independently.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">3. Accounts & Credits</h2>
              <p className="mt-2">Some features require an account and available credits.</p>
              <p className="mt-2">Credits:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Have no cash value</li>
                <li>Are consumed when AI-powered actions are executed</li>
                <li>May change pricing as the service evolves</li>
              </ul>
              <p className="mt-2">Abuse of the credit system may result in suspension.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">4. Acceptable Use</h2>
              <p className="mt-2">You agree not to:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Misuse the service for unlawful purposes</li>
                <li>Attempt to reverse engineer models or infrastructure</li>
                <li>Circumvent credit limits or access controls</li>
                <li>Upload or process content you do not have rights to</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">5. Intellectual Property</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>The platform software and interface are owned by Experimentein.</li>
                <li>
                  Scientific papers remain the property of their original authors and
                  publishers.
                </li>
                <li>AI-generated summaries are provided without ownership guarantees.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">6. Availability & Changes</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>We may modify or discontinue features.</li>
                <li>We may update extraction methods or models.</li>
                <li>We may temporarily suspend service for maintenance.</li>
              </ul>
              <p className="mt-2">We do not guarantee uninterrupted availability.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">7. Limitation of Liability</h2>
              <p className="mt-2">Experimentein is provided as is.</p>
              <p className="mt-2">We are not liable for:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Decisions made based on generated outputs</li>
                <li>Errors or omissions in extracted experiments</li>
                <li>Loss of data due to service interruption</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">8. Termination</h2>
              <p className="mt-2">
                We may suspend or terminate access if these terms are violated.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">9. Governing Law</h2>
              <p className="mt-2">
                These terms are governed by applicable laws based on the operators
                jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">10. Contact</h2>
              <p className="mt-2">Questions about these terms can be sent to:</p>
              <p className="mt-2 font-semibold text-neutral-900">Email: contact@experimentein.ai</p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

