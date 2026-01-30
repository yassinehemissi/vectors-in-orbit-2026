export function SiteFooter() {
  return (
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
  );
}
