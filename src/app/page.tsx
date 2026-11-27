import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Tour } from "@/components/tour/tour";
import { WaitlistForm } from "@/components/waitlist-form";

export default function Home() {
  return (
    <>
      <SiteHeader overlay />
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
              <p className="mt-4 text-ink-2">
                Beta testers get the app through TestFlight on iPhone and Google Play testing on
                Android, before it reaches the stores.
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
