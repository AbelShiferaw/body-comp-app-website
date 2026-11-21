import Link from "next/link";

import { screens } from "@/lib/screens";
import { Phone } from "./phone";
import { StoreButtons } from "./store-buttons";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
      <div>
        <p className="font-hud text-xs font-semibold uppercase tracking-[0.25em] text-lean">
          The app · iPhone and Android · Private beta
        </p>
        <h1 className="font-display mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Your DEXA scan, in 3D, in your pocket.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
          Obsessed is a mobile app that turns your DEXA results into a 3D body. Tap any region to
          see its fat and lean mass, and compare scans to see exactly what changed. Every scan
          levels you up.
        </p>
        <StoreButtons className="mt-8" />
        <p className="mt-4 text-sm text-ink-3">
          Not out yet.{" "}
          <Link href="#waitlist" className="font-semibold text-lean hover:underline">
            Join the beta waitlist
          </Link>{" "}
          to get it first. Syncs scans from BodySpec, with more DEXA providers to follow.
        </p>
      </div>

      <div className="relative mx-auto h-[520px] w-full max-w-md sm:h-[600px]">
        <div className="absolute left-0 top-12 w-[200px] -rotate-6 sm:w-[240px]">
          <Phone
            {...screens.fat}
            alt="Obsessed app, Fat view: regional fat on the 3D body with the belly selected"
            sizes="240px"
          />
        </div>
        <div className="absolute right-0 top-0 w-[225px] sm:w-[270px]">
          <Phone
            {...screens.home}
            alt="Obsessed app home screen: level, body fat, lean mass and visceral fat above the 3D body"
            priority
            sizes="280px"
          />
        </div>
      </div>
    </section>
  );
}
