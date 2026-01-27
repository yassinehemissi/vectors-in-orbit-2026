export default function ContactPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-16 text-neutral-900">
      <div className="mx-auto w-full max-w-3xl rounded-[32px] border border-neutral-200/70 bg-white p-8 shadow-sm">
        <p className="text-xs uppercase text-neutral-400">Contact</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
          Contact
        </h1>
        <div className="mt-8 space-y-6 text-sm text-neutral-600">
          <p>We're happy to hear from you.</p>
          <p>For questions related to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>The platform</li>
            <li>Credits or billing</li>
            <li>Privacy or data handling</li>
            <li>Research collaboration</li>
          </ul>
          <p>
            Please contact us at:
          </p>
          <p className="font-semibold text-neutral-900">Email: contact@experimentein.ai</p>
          <p className="text-xs text-neutral-400">
            Experimentein.ai is an early-stage research platform. Feedback and
            constructive suggestions are welcome.
          </p>
        </div>
      </div>
    </main>
  );
}
