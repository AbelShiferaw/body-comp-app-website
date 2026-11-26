"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect, useRef, useState } from "react";

import data from "@/lib/body3d-data.json";
import { screens } from "@/lib/screens";
import { Phone } from "../phone";
import { StoreButtons } from "../store-buttons";
import { BodyScene, Slot, type Colors, type Pose } from "./body-scene";

// ---------------------------------------------------------------------------
// Sample numbers (the app's made-up fixture timeline, never real scans).

const [first, , latest] = data.scans;
const r = latest.regions;
const b = latest.bands;
const fmtDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
const kg = (x: number) => `${x.toFixed(2)} kg`;
const pct = (x: number) => `${x.toFixed(1)}%`;

// ---------------------------------------------------------------------------
// Stops: one per screen of scrolling.

const zero = [0, 0, 0, 0, 0, 0, 0, 0];
const focusOn = (...slots: number[]) => zero.map((_, i) => (slots.includes(i) ? 1 : 0));
const base: Colors = { base: 1, fat: 0, fatChange: 0, leanChange: 0 };
const fat: Colors = { base: 0, fat: 1, fatChange: 0, leanChange: 0 };
const fatChange: Colors = { base: 0, fat: 0, fatChange: 1, leanChange: 0 };
const leanChange: Colors = { base: 0, fat: 0, fatChange: 0, leanChange: 1 };

type Stop = {
  id: string;
  pose: Omit<Pose, "morph" | "shift" | "lift">;
  /** Mask slot whose front surface the label touches, `dy` metres above its middle. */
  pin: { slot: number; dy?: number; side?: number } | null;
  pinLabel?: string;
};

const STOPS: Stop[] = [
  {
    id: "hero",
    pose: {
      target: [0, 0.6, 0],
      distance: 1.55,
      yaw: 0.2,
      spin: 0.12,
      colors: base,
      focus: zero,
      pitch: 0.05,
    },
    pin: null,
  },
  {
    id: "arms",
    pose: {
      target: [0.27, 0.4, 0],
      distance: 1.35,
      yaw: -0.35,
      spin: 0,
      colors: leanChange,
      focus: focusOn(Slot.leftArm, Slot.rightArm),
      pitch: 0.08,
    },
    pin: { slot: Slot.leftArm, dy: 0.08 },
    pinLabel: `Left arm · ${kg(r.leftArm.leanKg)} lean`,
  },
  {
    id: "belly",
    pose: {
      target: [0, 0.22, 0],
      distance: 1.15,
      yaw: 0.3,
      spin: 0,
      colors: fat,
      focus: focusOn(Slot.android),
      pitch: 0.12,
    },
    pin: { slot: Slot.android },
    pinLabel: `Belly · ${pct(b.android.fatPct)} fat`,
  },
  {
    id: "legs",
    pose: {
      target: [0.02, -0.24, 0],
      distance: 1.6,
      yaw: -0.4,
      spin: 0,
      colors: fat,
      focus: focusOn(Slot.leftLeg, Slot.rightLeg, Slot.gynoid),
      pitch: -0.06,
    },
    pin: { slot: Slot.gynoid, side: -1 },
    pinLabel: `Hips · ${pct(b.gynoid.fatPct)} fat`,
  },
  {
    id: "fatmap",
    pose: {
      target: [0, -0.1, 0],
      distance: 2.7,
      yaw: 0.5,
      spin: 0.15,
      colors: fat,
      focus: zero,
      pitch: 0.08,
    },
    pin: { slot: Slot.trunk, dy: -0.08 },
    pinLabel: `Trunk · ${pct(r.trunk.fatPct)} fat`,
  },
  {
    id: "change",
    pose: {
      target: [0, 0.05, 0],
      distance: 3.1,
      yaw: 0,
      spin: 0,
      colors: fatChange,
      focus: zero,
      pitch: 0.04,
    },
    pin: { slot: Slot.android },
    pinLabel: `Belly · ▼ ${kg(first.bands.android.fatKg - b.android.fatKg)} fat since Mar`,
  },
  {
    id: "level",
    pose: {
      target: [0, 0.55, 0],
      distance: 1.7,
      yaw: 0,
      spin: 0.3,
      colors: base,
      focus: zero,
      pitch: 0.04,
    },
    pin: null,
  },
];
/** Screens of scrolling per stop. */
const STOP_SCREENS = 1.6;
const CHANGE = STOPS.findIndex((s) => s.id === "change");

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** The pose at scroll position `p` (0 = first stop, 1 = second, ...). */
function poseAt(p: number, mobile: boolean, shift: number): Pose {
  const i = Math.min(STOPS.length - 1, Math.max(0, Math.floor(p)));
  const j = Math.min(STOPS.length - 1, i + 1);
  const f = p - i;
  // The camera keeps moving, slowing a little at each stop instead of stopping.
  const u = f - (0.3 * Math.sin(2 * Math.PI * f)) / (2 * Math.PI);
  // Colors and highlights fade over the middle of the move.
  const t = smooth(0.15, 0.85, f);
  const a = STOPS[i].pose;
  const c = STOPS[j].pose;
  // A Catmull-Rom curve through the stops, so the path bends smoothly through
  // each one instead of changing direction with a jolt.
  const h = Math.max(0, i - 1);
  const k = Math.min(STOPS.length - 1, j + 1);
  const curve = (get: (pose: Stop["pose"]) => number) => {
    const p0 = get(STOPS[h].pose);
    const p1 = get(a);
    const p2 = get(c);
    const p3 = get(STOPS[k].pose);
    const u2 = u * u;
    const u3 = u2 * u;
    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * u +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * u3)
    );
  };
  // Between two different heatmaps, pass through the plain body instead of
  // mixing them (blue and orange would make purple).
  const blend = (x: Colors, y: Colors, u: number) =>
    Object.fromEntries(
      (Object.keys(x) as (keyof Colors)[]).map((k) => [k, mix(x[k], y[k], u)]),
    ) as Colors;
  const viaBase = a.colors !== c.colors && a.colors !== base && c.colors !== base;
  const colors = !viaBase
    ? blend(a.colors, c.colors, t)
    : t < 0.5
      ? blend(a.colors, base, t * 2)
      : blend(base, c.colors, t * 2 - 1);
  // Change stop: rewind to the first scan on the way in, then play it forward.
  let morph = 1;
  // It finishes on the stop itself, so a page that snaps there shows November.
  if (p > CHANGE - 1 && p < CHANGE - 0.55) morph = 1 - smooth(CHANGE - 0.95, CHANGE - 0.6, p);
  else if (p >= CHANGE - 0.55 && p < CHANGE + 0.5) morph = smooth(CHANGE - 0.5, CHANGE - 0.02, p);
  return {
    target: [0, 1, 2].map((n) => curve((q) => q.target[n])) as Pose["target"],
    distance: curve((q) => q.distance) * (mobile ? 1.45 : 1),
    lift: mobile ? 0.2 : 0,
    yaw: curve((q) => q.yaw),
    spin: mix(a.spin, c.spin, t),
    colors,
    focus: a.focus.map((f, k) => mix(f, c.focus[k], t)),
    morph,
    shift: mobile ? 0 : shift,
    pitch: curve((q) => q.pitch),
  };
}

// ---------------------------------------------------------------------------

function SampleChip() {
  return (
    <span className="rounded-full border border-outline px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-3">
      Sample data
    </span>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{label}</div>
      <div className="font-display text-2xl font-extrabold text-ink">{value}</div>
      {note && <div className="text-xs font-medium text-lean">{note}</div>}
    </div>
  );
}

function Legend({
  stops,
  format,
}: {
  stops: { value: number; color: string }[];
  format: (v: number) => string;
}) {
  return (
    <div className="mt-5">
      <div
        className="h-2 rounded-full"
        style={{ background: `linear-gradient(90deg, ${stops.map((s) => s.color).join(", ")})` }}
      />
      <div className="mt-1 flex justify-between text-[11px] text-ink-3">
        {stops.map((s) => (
          <span key={s.value}>{format(s.value)}</span>
        ))}
      </div>
    </div>
  );
}

function Card({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pointer-events-auto w-full max-w-md rounded-3xl border border-outline/70 bg-surface/85 p-6 shadow-xl shadow-black/5 backdrop-blur-md sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="font-hud text-xs font-semibold uppercase tracking-[0.22em] text-lean">
          {eyebrow}
        </p>
        <SampleChip />
      </div>
      <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
        {title}
      </h2>
      {children}
    </div>
  );
}

function HexBadge({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 100 100" className="h-16 w-16" aria-label={`Level ${level}`}>
      <polygon
        points="50,4 92,27 92,73 50,96 8,73 8,27"
        className="fill-none stroke-lean"
        strokeWidth="6"
      />
      <text
        x="50"
        y="64"
        textAnchor="middle"
        className="fill-lean font-display"
        fontSize="40"
        fontWeight="800"
      >
        {level}
      </text>
    </svg>
  );
}

const fatDrop = first.bodyFatPct - latest.bodyFatPct;
const leanGain = latest.leanKg - first.leanKg;

export function ScrollStory() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const pinText = useRef<HTMLSpanElement>(null);
  const line = useRef<SVGLineElement>(null);
  const changeDate = useRef<HTMLSpanElement>(null);
  const changeFat = useRef<HTMLSpanElement>(null);
  const changeLean = useRef<HTMLSpanElement>(null);
  const sceneRef = useRef<BodyScene | null>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // The body's tone follows the page's light or dark theme.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => sceneRef.current?.setTheme(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [loaded]);

  useEffect(() => {
    const el = canvas.current;
    const root = wrap.current;
    if (!el || !root) return;
    let scene: BodyScene;
    try {
      scene = new BodyScene(el, "/body3d");
    } catch {
      // No WebGL: say so instead of a blank page.
      queueMicrotask(() => setFailed(true));
      return;
    }
    sceneRef.current = scene;
    scene.ready.then(
      () => setLoaded(true),
      () => setFailed(true),
    );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Inertial scrolling: wheel and trackpad steps glide instead of jumping.
    const lenis = reduce.matches ? null : new Lenis({ autoRaf: true, lerp: 0.085 });
    // Snap: when scrolling settles between two stops, glide to the nearer one
    // so a section is never left half on screen.
    let snapTimer = 0;
    const snap = () => {
      if (!lenis) return;
      const stopPx = window.innerHeight * STOP_SCREENS;
      const top = root.getBoundingClientRect().top + window.scrollY;
      const p = (window.scrollY - top) / stopPx;
      if (p < 0 || p > STOPS.length - 1) return;
      const n = Math.round(p);
      if (Math.abs(p - n) < 0.02) return;
      lenis.scrollTo(top + n * stopPx, { duration: 0.9 });
    };
    lenis?.on("scroll", () => {
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snap, 140);
    });

    let mobile = false;
    const onResize = () => {
      const rect = el.getBoundingClientRect();
      mobile = rect.width < 1024;
      scene.resize(rect.width, rect.height);
    };
    onResize();
    window.addEventListener("resize", onResize);

    // Drag sideways to turn the body; vertical swipes still scroll.
    let lastX = 0;
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("a,button,input,select,label,form")) return;
      scene.dragging = true;
      lastX = e.clientX;
    };
    const move = (e: PointerEvent) => {
      if (!scene.dragging) return;
      scene.dragYaw += (e.clientX - lastX) * 0.01;
      lastX = e.clientX;
    };
    const up = () => (scene.dragging = false);
    root.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-card]"));
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Desktop: cards on the left, tied to the body by a leader line.
      // Phones: cards along the bottom, with a label beside the dot.
      const pinned = !mobile;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const top = root.getBoundingClientRect().top + window.scrollY;
      const p = Math.min(
        STOPS.length - 1,
        Math.max(0, (window.scrollY - top) / (vh * STOP_SCREENS)),
      );
      const nearest = Math.round(p);
      const stop = STOPS[nearest];
      const near = Math.max(0, 1 - Math.abs(p - nearest) * 3);

      // The hero text needs more room than a card, so the body starts further right.
      const shift = p > 0.5 ? 0.1 : 0.17;
      const pose = poseAt(p, mobile, shift);
      scene.frame(pose, dt, reduce.matches);

      const anchor = stop.pin
        ? (() => {
            return scene.project(scene.surfacePoint(stop.pin.slot, stop.pin.dy, stop.pin.side));
          })()
        : null;

      // Cards fade and drift with their stop; pinned ones float beside their anchor.
      let active = -1;
      cards.forEach((c, i) => {
        const d = p - i;
        const o = Math.max(0, Math.min(1, 1 - Math.abs(d) * 1.8));
        c.style.opacity = String(o);
        c.style.visibility = o < 0.01 ? "hidden" : "visible";
        if (o > 0.5) active = i;
        if (pinned && i > 0 && anchor && i === nearest) {
          const w = Math.min(380, vw * 0.4);
          // Cards sit on the left, vertically centered; the leader line
          // connects them to the body part.
          const x = Math.max(24, vw * 0.06);
          const h = c.offsetHeight || 320;
          const y = Math.max(80, (vh - h) / 2);
          c.style.position = "fixed";
          c.style.height = "auto";
          c.style.left = "0";
          c.style.top = "0";
          c.style.width = `${w}px`;
          c.style.transform = `translate(${x.toFixed(0)}px, ${(y - d * 60).toFixed(0)}px)`;
        } else {
          c.style.position = "";
          c.style.height = "";
          c.style.left = "";
          c.style.top = "";
          c.style.width = "";
          c.style.transform = `translateY(${(-d * 60).toFixed(1)}px)`;
          if (pinned && i > 0 && i !== nearest) c.style.visibility = "hidden";
        }
      });

      // Pinned dot, label and leader line.
      if (pin.current && line.current) {
        if (anchor && near > 0) {
          pin.current.style.opacity = String(near);
          pin.current.style.transform = `translate(${anchor.x}px, ${anchor.y}px)`;
          if (pinText.current) {
            if (pinText.current.dataset.stop !== stop.id) {
              pinText.current.textContent = stop.pinLabel ?? "";
              pinText.current.dataset.stop = stop.id;
            }
            pinText.current.style.display = pinned ? "none" : "";
            // Keep the label on screen: near the right edge it goes left of the dot.
            const flip = anchor.x > vw - 200;
            pinText.current.style.left = flip ? "auto" : "";
            pinText.current.style.right = flip ? "16px" : "";
          }
          const card = active >= 0 ? cards[active]?.firstElementChild : null;
          if (card && !mobile) {
            const cr = card.getBoundingClientRect();
            const toLeft = cr.left > anchor.x;
            line.current.setAttribute("x1", String(toLeft ? cr.left : cr.right));
            line.current.setAttribute(
              "y1",
              String(Math.min(cr.bottom - 24, Math.max(cr.top + 24, anchor.y))),
            );
            line.current.setAttribute("x2", String(anchor.x));
            line.current.setAttribute("y2", String(anchor.y));
            line.current.style.opacity = String(near * 0.7);
          } else line.current.style.opacity = "0";
        } else {
          pin.current.style.opacity = "0";
          line.current.style.opacity = "0";
        }
      }

      // Live numbers while the change view plays.
      const m = pose.morph;
      if (changeFat.current)
        changeFat.current.textContent = pct(mix(first.bodyFatPct, latest.bodyFatPct, m));
      if (changeLean.current)
        changeLean.current.textContent = `${mix(first.leanKg, latest.leanKg, m).toFixed(1)} kg`;
      if (changeDate.current)
        changeDate.current.textContent = m < 0.5 ? fmtDate(first.date) : fmtDate(latest.date);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      root.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      sceneRef.current = null;
      window.clearTimeout(snapTimer);
      lenis?.destroy();
      scene.dispose();
    };
  }, []);

  const section = "relative h-[160svh] px-4 sm:px-6 pointer-events-none";
  // Each card stays on screen while its (taller) section scrolls past.
  const inner =
    "sticky top-0 mx-auto flex h-[100svh] w-full max-w-6xl items-end pb-6 lg:items-center lg:pb-0";

  return (
    <div ref={wrap} className="relative touch-pan-y select-none">
      {/* The body: one canvas pinned to the viewport for the whole story. */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_62%_45%,var(--surface-high),transparent_60%)]"
          />
          <canvas
            ref={canvas}
            className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
            aria-label="3D body from the Obsessed app, showing sample data"
            role="img"
          />
          {!loaded && !failed && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-3 lg:pl-[34%]">
              Loading the 3D body…
            </div>
          )}
          {failed && (
            // No WebGL: show the app itself instead of the 3D body.
            <div className="absolute inset-0 flex items-center justify-center p-8 lg:pl-[40%]">
              <div className="w-[min(260px,55vw)]">
                <Phone
                  {...screens.home}
                  alt="Obsessed app home screen, sample data"
                  sizes="260px"
                />
              </div>
            </div>
          )}
        </div>
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
          <line
            ref={line}
            className="stroke-lean"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            style={{ opacity: 0 }}
          />
        </svg>
        <div
          ref={pin}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0"
          style={{ opacity: 0 }}
        >
          <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-lean ring-4 ring-lean/25" />
          <span
            ref={pinText}
            className="absolute left-4 top-[-11px] whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-bg"
          />
        </div>
        <p className="absolute bottom-3 left-1/2 hidden -translate-x-1/2 text-[11px] text-ink-3 lg:block">
          Drag to turn the body
        </p>
      </div>

      {/* The story, scrolled over the pinned body. */}
      <div className="relative -mt-[100svh]">
        <section className={section}>
          <div data-card className={inner}>
            <div className="pointer-events-auto max-w-xl rounded-3xl bg-bg/70 p-2 backdrop-blur-sm lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
              <p className="font-hud text-xs font-semibold uppercase tracking-[0.25em] text-lean">
                The app · iPhone and Android · Private beta
              </p>
              <h1 className="font-display mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Your DEXA scan, in 3D, in your pocket.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-2">
                This is the body the Obsessed app builds from a scan. Scroll to walk through it the
                way the app does.
              </p>
              <StoreButtons className="mt-7" href="#waitlist" />
              <p className="mt-6 flex items-center gap-2 text-sm text-ink-3">
                <span className="inline-block animate-bounce">↓</span> Scroll to explore
              </p>
            </div>
          </div>
        </section>

        <section className={section}>
          <div data-card className={inner}>
            <Card eyebrow="Arms · left and right" title="Know if one side is lagging.">
              <p className="mt-3 text-ink-2">
                Lean mass for each arm and leg, from the scan. The color shows where you built
                muscle since your first scan.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-4">
                <Stat label="Left arm" value={kg(r.leftArm.leanKg)} />
                <Stat label="Right arm" value={kg(r.rightArm.leanKg)} />
                <Stat
                  label="Since Mar"
                  value={`+${kg(r.leftArm.leanKg - first.regions.leftArm.leanKg)}`}
                  note="left arm lean"
                />
              </div>
              <Legend
                stops={data.legend.leanChange}
                format={(v) => (v === 0 ? "no change" : `${v > 0 ? "+" : ""}${v * 100}% lean`)}
              />
            </Card>
          </div>
        </section>

        <section className={section}>
          <div data-card className={inner}>
            <Card eyebrow="Tap any region" title="See where your fat actually sits.">
              <p className="mt-3 text-ink-2">
                DEXA measures fat region by region. Tap the belly in the app and you get its own
                numbers, not just one body fat percentage.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-4">
                <Stat label="Belly fat" value={pct(b.android.fatPct)} />
                <Stat label="Belly fat mass" value={kg(b.android.fatKg)} />
                <Stat
                  label="Visceral"
                  value={`${latest.visceralG} g`}
                  note={`▼ ${first.visceralG - latest.visceralG} g since Mar`}
                />
              </div>
            </Card>
          </div>
        </section>

        <section className={section}>
          <div data-card className={inner}>
            <Card eyebrow="Legs and hips" title="Where most of your muscle lives.">
              <p className="mt-3 text-ink-2">
                Legs hold most of your lean mass, and hips are often where fat goes last. Both get
                their own numbers.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-4">
                <Stat label="Legs lean" value={kg(r.leftLeg.leanKg + r.rightLeg.leanKg)} />
                <Stat label="Right leg fat" value={pct(r.rightLeg.fatPct)} />
                <Stat label="Hips fat" value={pct(b.gynoid.fatPct)} />
              </div>
            </Card>
          </div>
        </section>

        <section className={section}>
          <div data-card className={inner}>
            <Card eyebrow="Fat view" title="Your whole body as a fat map.">
              <p className="mt-3 text-ink-2">
                Every region is colored by its fat percentage from your latest scan, so you see your
                body composition at a glance.
              </p>
              <Legend stops={data.legend.fatPct} format={(v) => `${v}% fat`} />
            </Card>
          </div>
        </section>

        <section className={section}>
          <div data-card className={inner}>
            <Card eyebrow="Change view" title="Watch your body change between scans.">
              <p className="mt-3 text-ink-2">
                Pick any two scans and the body morphs from one to the other. Blue is where fat came
                off.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                    Scan
                  </div>
                  <span ref={changeDate} className="font-display text-lg font-extrabold text-ink">
                    {fmtDate(latest.date)}
                  </span>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                    Body fat
                  </div>
                  <span ref={changeFat} className="font-display text-2xl font-extrabold text-ink">
                    {pct(latest.bodyFatPct)}
                  </span>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                    Lean
                  </div>
                  <span ref={changeLean} className="font-display text-2xl font-extrabold text-ink">
                    {latest.leanKg.toFixed(1)} kg
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-lean">
                ▼ {fatDrop.toFixed(1)} pts body fat · ▲ {leanGain.toFixed(1)} kg lean,{" "}
                {fmtDate(first.date)} → {fmtDate(latest.date)}
              </p>
              <Legend
                stops={data.legend.fatChange}
                format={(v) => (v === 0 ? "no change" : `${v > 0 ? "+" : ""}${v * 100}% fat`)}
              />
            </Card>
          </div>
        </section>

        <section className={section}>
          <div data-card className={inner}>
            <Card eyebrow="Levels" title="Every scan levels you up.">
              <div className="mt-4 flex items-center gap-4">
                <HexBadge level={data.scans.length} />
                <div>
                  <div className="font-display text-xl font-extrabold text-ink">
                    Level {data.scans.length}
                  </div>
                  <div className="text-sm text-ink-2">{data.scans.length} DEXA scans</div>
                </div>
              </div>
              <p className="mt-4 text-ink-2">
                Your level is your number of DEXA scans. A bar counts down to your next one, about
                every 12 weeks, so you keep coming back to see what changed.
              </p>
              <div className="mt-4 h-1.5 w-full rounded-full bg-surface-high">
                <div className="h-full w-1/5 rounded-full bg-lean" />
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
