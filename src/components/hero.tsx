import Link from "next/link";

import { BodyCard } from "./body-card";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
      <div>
        <p className="font-hud text-xs font-semibold uppercase tracking-[0.25em] text-lean">
          Private beta · iPhone and Android · US
        </p>
        <h1 className="font-display mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
          See your DEXA scan come to life.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
          Obsessed turns your DEXA results into a 3D body you can explore, region by region. See
          where you carry fat, where you&apos;ve added lean mass, and how it all changed since your
          last scan. Every scan levels you up.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="#waitlist"
            className="rounded-full bg-lean px-6 py-3 text-base font-semibold text-on-lean hover:opacity-90"
          >
            Join the beta waitlist
          </Link>
          <Link href="#how" className="text-base font-semibold text-ink hover:text-lean">
            How it works →
          </Link>
        </div>
        <p className="mt-6 text-sm text-ink-3">
          Syncs your scans from BodySpec first, with more DEXA providers to follow.
        </p>
      </div>
      <BodyCard />
    </section>
  );
}
