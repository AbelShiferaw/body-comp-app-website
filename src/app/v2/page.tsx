import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { Tour } from "@/components/v2/tour";
import { WaitlistForm } from "@/components/waitlist-form";
import { Wordmark } from "@/components/wordmark";

// Interactive version of the landing page, for local comparison. Not linked
// from the live site and kept out of search until we pick a version.
export const metadata: Metadata = {
  title: "Explore the body",
  robots: { index: false, follow: false },
};

export default function InteractivePage() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-outline/50 bg-bg/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Wordmark />
          <nav className="flex items-center gap-5 text-sm text-ink-2">
            <Link href="/" className="hidden hover:text-ink sm:inline">
              Classic site
            </Link>
            <a
              href="#waitlist"
              className="rounded-full bg-lean px-4 py-2 font-semibold text-on-lean hover:opacity-90"
            >
              Get the app
            </a>
          </nav>
        </div>
      </header>
      <main>
        <Tour />
        <section id="waitlist" className="scroll-mt-20 border-t border-outline bg-surface-high/50">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
            <div className="max-w-lg">
              <p className="font-hud text-xs font-semibold uppercase tracking-[0.25em] text-lean">
                Private beta
              </p>
              <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Get the app first.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-2">
                We’re inviting a small group of lifters in the US to test Obsessed on iPhone and
                Android. If you’ve had a DEXA scan, you’ll get the full experience on day one.
              </p>
              <p className="mt-4 text-sm text-ink-3">
                The body and numbers above are the app’s sample data, not a real person’s scan.
              </p>
            </div>
            <WaitlistForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
