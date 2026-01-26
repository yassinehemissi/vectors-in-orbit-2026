import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <SiteHeader />
      <main className="px-6 py-16">
        <div className="mx-auto w-full max-w-3xl rounded-[32px] border border-neutral-200/70 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase text-neutral-400">Privacy Policy</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-neutral-500">Last updated: {new Date("1-27-2026").toUTCString()}</p>

          <div className="mt-8 space-y-6 text-sm text-neutral-600">
            <p>
              Experimentein.ai (Experimentein, we, us) is a research-oriented web
              application designed to help users explore, analyze, and compare
              scientific experiments extracted from public research papers.
            </p>
            <p>
              We take privacy seriously and collect only what is necessary to
              operate the service.
            </p>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">
                1. Information We Collect
              </h2>
              <h3 className="mt-4 text-base font-semibold text-neutral-900">
                1.1 Account Information
              </h3>
              <p className="mt-2">When you create an account, we may collect:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Email address</li>
                <li>Display name</li>
                <li>Profile image (if provided)</li>
                <li>Account plan and preferences</li>
              </ul>
              <p className="mt-2">
                This data is stored in our application database for authentication
                and account management.
              </p>

              <h3 className="mt-4 text-base font-semibold text-neutral-900">
                1.2 Usage & Credits Information
              </h3>
              <p className="mt-2">
                To operate the credit-based system, we record:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Credit balance and transactions</li>
                <li>Actions performed (e.g. experiment analysis, enrichment)</li>
                <li>Token usage metadata (counts only, not raw prompts)</li>
              </ul>
              <p className="mt-2">
                This information is used solely for billing, usage tracking, and
                abuse prevention.
              </p>

              <h3 className="mt-4 text-base font-semibold text-neutral-900">
                1.3 Research Content
              </h3>
              <p className="mt-2">Experimentein processes public scientific content, including:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Research papers (e.g. from arXiv)</li>
                <li>Extracted experiment summaries</li>
                <li>Derived embeddings for semantic search</li>
              </ul>
              <p className="mt-2">
                We do not collect or claim ownership over private or proprietary
                research unless explicitly uploaded by the user.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">
                2. How We Use Information
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Authenticate users</li>
                <li>Provide access to features and credits</li>
                <li>Enable semantic search and experiment comparison</li>
                <li>Improve system performance and reliability</li>
                <li>Prevent misuse of the service</li>
              </ul>
              <p className="mt-2">We do not sell personal data.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">
                3. Data Storage & Processing
              </h2>
              <p className="mt-2">Experimentein uses multiple systems for different purposes:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Application data (users, credits): stored in a general-purpose database</li>
                <li>Scientific content: stored in a canonical research datastore</li>
                <li>Semantic vectors: stored in a vector search engine</li>
                <li>
                  AI processing: performed by third-party language models when explicitly
                  triggered by the user
                </li>
              </ul>
              <p className="mt-2">
                AI providers receive only the minimum necessary context to perform
                the requested task.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">4. Cookies & Tracking</h2>
              <p className="mt-2">
                We use only essential cookies or storage mechanisms required for:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Authentication</li>
                <li>Session management</li>
                <li>Security</li>
              </ul>
              <p className="mt-2">We do not use advertising trackers.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">5. Data Retention</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Account and credit data is retained while your account is active.</li>
                <li>
                  Research-derived content may be retained for reproducibility and system
                  integrity.
                </li>
                <li>You may request account deletion, which will remove personal identifiers.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">6. Your Rights</h2>
              <p className="mt-2">
                Depending on your jurisdiction, you may have the right to:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Access your personal data</li>
                <li>Request correction or deletion</li>
                <li>Withdraw consent</li>
              </ul>
              <p className="mt-2">
                Requests can be made via the contact information below.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">7. Changes</h2>
              <p className="mt-2">
                We may update this Privacy Policy as the service evolves. Material
                changes will be reflected by an updated date.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">8. Contact</h2>
              <p className="mt-2">For privacy-related questions, contact us at:</p>
              <p className="mt-2 font-semibold text-neutral-900">Email: contact@experimentein.ai</p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

