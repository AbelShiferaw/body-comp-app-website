"use client";

import Image, { type StaticImageData } from "next/image";
import { useState } from "react";

import bodyChange from "../../public/images/body-change.png";
import bodyDark from "../../public/images/body-studio-dark.png";
import bodyFat from "../../public/images/body-fat.png";
import bodyLight from "../../public/images/body-studio-light.png";

type Legend = { color: string; label: string }[];

type View = {
  id: "body" | "fat" | "change";
  label: string;
  title: string;
  body: string;
  image: StaticImageData;
  darkImage?: StaticImageData;
  legend?: Legend;
};

// Legend colors match the app's Fat and Change views.
const VIEWS: View[] = [
  {
    id: "body",
    label: "Body",
    title: "Your shape, from your scan",
    body: "The 3D body is shaped by your own DEXA numbers, region by region.",
    image: bodyLight,
    darkImage: bodyDark,
  },
  {
    id: "fat",
    label: "Fat",
    title: "Where you carry fat",
    body: "Each region is colored by its fat percentage from your scan, so belly fat shows on the belly instead of hiding in one number.",
    image: bodyFat,
    legend: [
      { color: "var(--map-fat-high)", label: "25% fat" },
      { color: "var(--map-fat-mid)", label: "12%" },
      { color: "var(--map-fat-low)", label: "4%" },
    ],
  },
  {
    id: "change",
    label: "Change",
    title: "What changed between scans",
    body: "Pick two scans and see fat lost or gained per region. Switch to lean change to see where you added lean mass.",
    image: bodyChange,
    legend: [
      { color: "var(--map-gain)", label: "+30% fat" },
      { color: "var(--map-none)", label: "No change" },
      { color: "var(--map-loss)", label: "−30% fat" },
    ],
  },
];

export function BodyViews() {
  const [active, setActive] = useState<View["id"]>("fat");
  const view = VIEWS.find((v) => v.id === active) ?? VIEWS[0];

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
      <div className="relative mx-auto h-[28rem] w-full max-w-sm overflow-hidden rounded-3xl border border-outline bg-[radial-gradient(ellipse_at_50%_55%,var(--surface-high),var(--surface)_70%)]">
        <Image
          key={view.id}
          src={view.image}
          alt={`${view.label} view of the 3D body`}
          sizes="320px"
          className={`absolute inset-x-0 bottom-6 mx-auto h-[88%] w-auto object-contain ${view.darkImage ? "dark:hidden" : ""}`}
        />
        {view.darkImage && (
          <Image
            src={view.darkImage}
            alt={`${view.label} view of the 3D body`}
            sizes="320px"
            className="absolute inset-x-0 bottom-6 mx-auto hidden h-[88%] w-auto object-contain dark:block"
          />
        )}
        {view.legend && (
          <ul className="absolute left-4 top-4 space-y-1 rounded-lg bg-surface/90 px-3 py-2 text-xs text-ink-2 backdrop-blur">
            {view.legend.map((l) => (
              <li key={l.label} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: l.color }}
                />
                {l.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          See it on the body, not in a spreadsheet.
        </h2>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink-2">
          Three views, one body. The same ones you get on the app&apos;s home screen.
        </p>

        <div
          role="tablist"
          aria-label="Body views"
          className="mt-8 inline-flex rounded-full border border-outline bg-surface p-1"
        >
          {VIEWS.map((v) => (
            <button
              key={v.id}
              role="tab"
              type="button"
              aria-selected={v.id === active}
              onClick={() => setActive(v.id)}
              className={`rounded-full px-5 py-2 text-sm font-semibold ${
                v.id === active ? "bg-lean text-on-lean" : "text-ink-2 hover:text-ink"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="mt-6 max-w-md">
          <h3 className="text-lg font-bold text-ink">{view.title}</h3>
          <p className="mt-2 leading-relaxed text-ink-2">{view.body}</p>
        </div>

        <dl className="mt-6 grid max-w-md grid-cols-2 gap-4">
          <div className="rounded-2xl border border-outline bg-surface p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-3">
              Body fat, May → Nov
            </dt>
            <dd className="font-display mt-1 text-3xl font-extrabold text-ink tabular-nums">
              8.6%
            </dd>
            <dd className="mt-1 text-sm text-lean tabular-nums">▼ 3.8 pts</dd>
          </div>
          <div className="rounded-2xl border border-outline bg-surface p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-3">
              Lean mass, May → Nov
            </dt>
            <dd className="font-display mt-1 text-3xl font-extrabold text-ink tabular-nums">
              59.4 kg
            </dd>
            <dd className="mt-1 text-sm text-lean tabular-nums">▲ 1.6 kg</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-ink-3">Sample data for illustration.</p>
      </div>
    </div>
  );
}
