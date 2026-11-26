import Link from "next/link";

import { Wordmark } from "./wordmark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-outline/60 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Wordmark />
        <nav className="flex items-center gap-6 text-sm text-ink-2">
          <Link
            href="/#waitlist"
            className="rounded-full bg-lean px-4 py-2 font-semibold text-on-lean hover:opacity-90"
          >
            Get the app
          </Link>
        </nav>
      </div>
    </header>
  );
}
