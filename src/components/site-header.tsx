import Link from "next/link";

import { Wordmark } from "./wordmark";

/**
 * Wordmark and "Get the app". On the home page it floats over the 3D tour
 * (`overlay`); on other pages it sticks to the top.
 */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header
      className={`${overlay ? "fixed inset-x-0" : "sticky"} top-0 z-30 border-b border-outline/50 bg-bg/70 backdrop-blur`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Wordmark />
        <Link
          href="/#waitlist"
          className="rounded-full bg-lean px-4 py-2 text-sm font-semibold text-on-lean hover:opacity-90"
        >
          Get the app
        </Link>
      </div>
    </header>
  );
}
