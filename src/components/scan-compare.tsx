"use client";

import Image from "next/image";
import { useState } from "react";

import avatarAfter from "../../public/images/avatar-after.png";
import avatarBefore from "../../public/images/avatar-before.png";

// Sample numbers from the design canvas (not a real person's scan).
const FROM = { label: "May 18", bodyFat: 12.4, lean: 57.8 };
const TO = { label: "Nov 9", bodyFat: 8.6, lean: 59.4 };

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Drag between two scans: the later scan is revealed from the left. */
export function ScanCompare() {
  const [pct, setPct] = useState(50);
  const t = pct / 100;
  const bodyFat = lerp(FROM.bodyFat, TO.bodyFat, t);
  const lean = lerp(FROM.lean, TO.lean, t);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
      <div className="relative mx-auto aspect-[300/570] w-full max-w-xs overflow-hidden rounded-3xl border border-holo-cyan/25 bg-holo-bg">
        <Image
          src={avatarBefore}
          alt={`Avatar at the ${FROM.label} scan`}
          fill
          sizes="320px"
          className="object-contain"
        />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
          <Image
            src={avatarAfter}
            alt={`Avatar at the ${TO.label} scan`}
            fill
            sizes="320px"
            className="object-contain"
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-y-0 w-0.5 bg-holo-cyan shadow-[0_0_12px_rgba(62,240,255,0.9)]"
          style={{ left: `${pct}%` }}
        />
        <span className="absolute left-3 top-3 rounded bg-holo-bg/80 px-2 py-1 font-hud text-[11px] uppercase tracking-[0.18em] text-holo-cyan">
          {TO.label}
        </span>
        <span className="absolute right-3 top-3 rounded bg-holo-bg/80 px-2 py-1 font-hud text-[11px] uppercase tracking-[0.18em] text-holo-ink/70">
          {FROM.label}
        </span>
      </div>

      <div>
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Six months, one slider.
        </h2>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink-2">
          Pick any two scans and scrub between them. The avatar morphs region by region, so you see
          exactly where the fat came off and where the muscle went on.
        </p>

        <label htmlFor="compare" className="mt-8 block text-sm font-medium text-ink-2">
          Drag to compare {FROM.label} and {TO.label}
        </label>
        <input
          id="compare"
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          className="mt-3 w-full max-w-md accent-[var(--lean)]"
        />

        <dl className="mt-6 grid max-w-md grid-cols-2 gap-4">
          <div className="rounded-2xl border border-outline bg-surface p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-3">Body fat</dt>
            <dd className="font-display mt-1 text-3xl font-extrabold text-ink tabular-nums">
              {bodyFat.toFixed(1)}%
            </dd>
            <dd className="mt-1 text-sm text-lean tabular-nums">
              ▼ {(FROM.bodyFat - bodyFat).toFixed(1)} pts
            </dd>
          </div>
          <div className="rounded-2xl border border-outline bg-surface p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-3">Lean mass</dt>
            <dd className="font-display mt-1 text-3xl font-extrabold text-ink tabular-nums">
              {lean.toFixed(1)} kg
            </dd>
            <dd className="mt-1 text-sm text-lean tabular-nums">
              ▲ {(lean - FROM.lean).toFixed(1)} kg
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-ink-3">Sample data for illustration.</p>
      </div>
    </div>
  );
}
