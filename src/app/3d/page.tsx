import type { Metadata } from "next";
import Link from "next/link";

import { ScrollStory } from "@/components/body3d/scroll-story";
import { Phone } from "@/components/phone";
import { SiteFooter } from "@/components/site-footer";
import { StoreButtons } from "@/components/store-buttons";
import { WaitlistForm } from "@/components/waitlist-form";
import { Wordmark } from "@/components/wordmark";
import { screens } from "@/lib/screens";

// Experimental interactive version, compared with the classic page before
// either becomes the home page.
export const metadata: Metadata = {
  title: "Explore the 3D body",
  robots: { index: false },
};

export default function Explore3D() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Wordmark />
          <nav className="flex items-center gap-5 text-sm text-ink-2">
            <Link href="/" className="hidden hover:text-ink sm:inline">
              Classic page
            </Link>
            <Link
              href="#waitlist"
              className="rounded-full bg-lean px-4 py-2 font-semibold text-on-lean hover:opacity-90"
            >
              Get the app
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <ScrollStory />
        <section
          id="waitlist"
          className="relative scroll-mt-16 border-t border-outline bg-surface-high/50"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1fr]">
            <div className="mx-auto w-[240px] sm:w-[270px]">
              <Phone
                {...screens.home}
                alt="Obsessed app home screen: the 3D body with body fat, lean mass and visceral fat"
                sizes="280px"
              />
              <p className="mt-4 text-center text-xs text-ink-3">
                The same body, in the app. Sample data.
              </p>
            </div>
            <div>
              <p className="font-hud text-xs font-semibold uppercase tracking-[0.25em] text-lean">
                Private beta
              </p>
              <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Now see it with your own scans.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-2">
                We’re inviting a small group of lifters in the US to test Obsessed on iPhone and
                Android. Connect BodySpec and your own body appears in the app.
              </p>
              <StoreButtons className="mt-6" href="#waitlist" />
              <div className="mt-8">
                <WaitlistForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
