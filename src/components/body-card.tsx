import Image from "next/image";

import bodyDark from "../../public/images/body-studio-dark.png";
import bodyLight from "../../public/images/body-studio-light.png";

type Stat = { label: string; value: string; delta: string };

// Sample numbers from the design canvas, not a real person's scan.
const STATS: Stat[] = [
  { label: "Body fat", value: "8.6%", delta: "▼ 3.8 pts" },
  { label: "Lean mass", value: "59.4 kg", delta: "▲ 1.6 kg" },
  { label: "Arms lean", value: "7.9 kg", delta: "▲ 0.6 kg" },
];

/** Hero visual: the app's Studio body with the home screen's level and stats. */
export function BodyCard() {
  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-outline bg-surface shadow-xl shadow-black/5">
      <div className="flex items-center gap-3 px-5 pt-5">
        <div className="relative grid h-11 w-11 place-items-center font-hud text-lg font-semibold text-lean">
          <svg aria-hidden viewBox="0 0 44 44" className="absolute inset-0 h-full w-full">
            <polygon
              points="12,3 32,3 42,22 32,41 12,41 2,22"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          4
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-2">
            Level 4 · 4 scans
          </p>
          <div className="mt-1.5 h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-surface-high">
            <div className="h-full w-2/3 rounded-full bg-lean" />
          </div>
          <p className="mt-1 text-[11px] text-ink-3">Next scan in 41 days</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 px-5">
        {STATS.map((s) => (
          <div key={s.label}>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
              {s.label}
            </dt>
            <dd className="font-display text-xl font-extrabold text-ink tabular-nums">{s.value}</dd>
            <dd className="text-xs text-lean tabular-nums">{s.delta}</dd>
          </div>
        ))}
      </dl>

      <div className="relative mt-4 h-80 bg-[radial-gradient(ellipse_at_50%_55%,var(--surface-high),var(--bg)_70%)] sm:h-96">
        <Image
          src={bodyLight}
          alt="3D body built from DEXA scan data"
          priority
          sizes="(min-width: 1024px) 300px, 70vw"
          className="absolute inset-x-0 bottom-4 mx-auto h-[92%] w-auto object-contain dark:hidden"
        />
        <Image
          src={bodyDark}
          alt="3D body built from DEXA scan data"
          priority
          sizes="(min-width: 1024px) 300px, 70vw"
          className="absolute inset-x-0 bottom-4 mx-auto hidden h-[92%] w-auto object-contain dark:block"
        />
        <div className="absolute bottom-4 left-4 rounded-xl border border-fat/40 bg-surface/90 px-3 py-2 backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fat">Milestone</p>
          <p className="text-sm font-semibold text-ink">Single-digit body fat</p>
        </div>
        <p className="absolute bottom-4 right-4 text-[10px] uppercase tracking-[0.2em] text-ink-3">
          Sample data
        </p>
      </div>
    </div>
  );
}
