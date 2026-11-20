import Image from "next/image";

import avatarAfter from "../../public/images/avatar-after.png";

type Stat = { label: string; value: string; delta: string; tone: "lean" | "fat" };

const STATS: Stat[] = [
  { label: "Body fat", value: "8.6%", delta: "▼ 3.8 pts", tone: "lean" },
  { label: "Lean mass", value: "59.4 kg", delta: "▲ 1.6 kg", tone: "lean" },
  { label: "Arms lean", value: "7.9 kg", delta: "▲ 0.6 kg", tone: "lean" },
];

/** The game-style hero: hologram avatar on a dark stage with HUD readouts. */
export function HologramStage() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl border border-holo-cyan/25 bg-holo-bg shadow-[0_0_80px_-20px_rgba(62,240,255,0.45)]">
      {/* Grid floor glow */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(62,240,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(62,240,255,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse at 50% 60%, black 30%, transparent 75%)",
        }}
      />

      <Image
        src={avatarAfter}
        alt="Hologram 3D avatar with defined muscles, built from DEXA scan data"
        priority
        placeholder="blur"
        sizes="(min-width: 1024px) 420px, 80vw"
        className="absolute bottom-0 left-1/2 h-[92%] w-auto -translate-x-1/2 object-contain"
      />

      {/* Scan beam */}
      <div
        aria-hidden
        className="scan-beam pointer-events-none absolute inset-x-6 top-0 h-[10%] bg-gradient-to-b from-transparent via-holo-cyan/25 to-transparent"
      />

      {/* HUD: level */}
      <div className="absolute left-4 top-4 flex items-center gap-3 font-hud text-holo-ink">
        <div className="relative grid h-11 w-11 place-items-center text-lg font-semibold text-holo-cyan">
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
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-holo-cyan/80">Level 4</p>
          <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-holo-cyan/15">
            <div className="h-full w-2/3 rounded-full bg-holo-cyan" />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-holo-ink/60">
            Next scan in 41 days
          </p>
        </div>
      </div>

      {/* HUD: stats */}
      <ul className="absolute right-4 top-4 space-y-2 font-hud">
        {STATS.map((s) => (
          <li
            key={s.label}
            className="rounded-lg border border-holo-cyan/25 bg-holo-bg/70 px-3 py-1.5 text-right backdrop-blur"
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-holo-ink/60">{s.label}</p>
            <p className="text-base font-semibold leading-tight text-holo-ink">{s.value}</p>
            <p
              className={`text-[11px] ${s.tone === "lean" ? "text-holo-cyan" : "text-holo-amber"}`}
            >
              {s.delta}
            </p>
          </li>
        ))}
      </ul>

      {/* Milestone toast */}
      <div className="absolute bottom-5 left-4 rounded-lg border border-holo-amber/40 bg-holo-bg/80 px-3 py-2 font-hud backdrop-blur">
        <p className="text-[10px] uppercase tracking-[0.2em] text-holo-amber">Milestone</p>
        <p className="text-sm font-semibold text-holo-ink">Single-digit body fat</p>
      </div>

      <p className="absolute bottom-5 right-4 font-hud text-[10px] uppercase tracking-[0.2em] text-holo-ink/40">
        Sample data
      </p>
    </div>
  );
}
