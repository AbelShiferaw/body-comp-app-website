"use client";

// The home page tour: a sticky 3D body over one full-screen section per stop
// (src/lib/tour.ts). The browser's own scroll snapping moves one stop per
// swipe or wheel flick (trackpad momentum included); when the stop changes,
// the camera flies there in a short timed move. Numbers are pinned to the body
// parts they belong to, and light or dark follows the system setting.
import { useEffect, useRef, useState } from "react";

import { screens } from "@/lib/screens";
import {
  frameAt,
  rgbCss,
  SAMPLE_LATEST,
  SAMPLE_START,
  STOPS,
  totals,
  visibility,
  type Mood,
  type Stop,
} from "@/lib/tour";
import { Phone } from "../phone";
import type { BodyScene } from "./body-scene";

/** Camera move between neighbouring stops, ms. The change stop plays slower. */
const MOVE_MS = 750;
const CHANGE_MS = 1600;
/** Right edge (px) of the caption on desktop: left-10 + 26rem + a gap. */
const CAPTION_RIGHT = 40 + 416 + 16;
const START_FAT = totals(SAMPLE_START).fatPct;
const LATEST_FAT = totals(SAMPLE_LATEST).fatPct;
const CHANGE_START = STOPS.findIndex((s) => s.id === "change-start");
const LAST = STOPS.length - 1;

function useMedia(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}

/**
 * The stop whose section fills the screen. 0 before the window reports a
 * height (first frame, hidden tabs), never NaN.
 */
function activeStop(track: HTMLElement | null) {
  const vh = window.innerHeight;
  if (!track || !(vh > 0)) return 0;
  const i = Math.round(-track.getBoundingClientRect().top / vh);
  return Number.isFinite(i) ? Math.min(LAST, Math.max(0, i)) : 0;
}

export function Tour() {
  const mood: Mood = useMedia("(prefers-color-scheme: dark)") ? "dark" : "light";
  const narrow = useMedia("(max-width: 767px)");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BodyScene | null>(null);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pinRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineFill = useRef<HTMLDivElement>(null);
  const timelineFat = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const narrowRef = useRef(narrow);
  useEffect(() => {
    narrowRef.current = narrow;
  }, [narrow]);
  const redrawRef = useRef(() => {});
  useEffect(() => {
    sceneRef.current?.setMood(mood);
    redrawRef.current();
  }, [mood, status]);

  // Scene setup and the render loop.
  useEffect(() => {
    const canvas = canvasRef.current!;
    let disposed = false;
    let raf = 0;
    let scene: BodyScene | null = null;
    let spin = 0;
    let dragging = false;
    let lastX = 0;
    // Shown progress: eases from `from` to the active stop over `duration`.
    let shown = 0;
    let from = 0;
    let to = 0;
    let startT = 0;
    let duration = 0;
    let lastShown = -1;
    let lastSpin = 0;
    let dirty = true;
    let cardWidths = new WeakMap<HTMLElement, number>();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      spin += (e.clientX - lastX) * 0.008;
      lastX = e.clientX;
    };
    const onUp = () => (dragging = false);
    // Mouse wheel and trackpad: one flick moves exactly one stop. The rest of
    // the flick, trackpad momentum included, is ignored until it dies down,
    // so a hard swipe can't skip stops or stop half way. Touch screens use
    // the browser's own snapping (see the sections below).
    let wanted: number | null = null;
    let locked = false;
    let moveEnd = 0;
    let lastWheel = 0;
    let acc = 0;
    const goTo = (track: HTMLElement, index: number) => {
      const top = window.scrollY + track.getBoundingClientRect().top;
      const y = index > LAST ? top + track.offsetHeight : top + index * window.innerHeight;
      wanted = Math.min(LAST, index);
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    };
    const onWheel = (e: WheelEvent) => {
      const track = trackRef.current;
      const vh = window.innerHeight;
      if (!track || !(vh > 0) || e.ctrlKey) return;
      const rect = track.getBoundingClientRect();
      const dir = Math.sign(e.deltaY);
      // At the top of the waitlist, a flick up goes back to the last stop.
      const backFromWaitlist = dir < 0 && Math.abs(rect.bottom) < 2;
      // Otherwise only while a tour stop fills the screen; the waitlist
      // scrolls normally.
      if (!backFromWaitlist && (rect.top > 1 || rect.bottom < vh - 1)) return;
      const i = backFromWaitlist ? LAST + 1 : activeStop(track);
      if (dir < 0 && i === 0 && rect.top > -1) return;
      e.preventDefault();
      const now = performance.now();
      const gap = now - lastWheel;
      lastWheel = now;
      if (locked) {
        if (now > moveEnd && gap > 180) locked = false;
        else return;
      }
      acc = gap > 180 ? e.deltaY : acc + e.deltaY;
      if (Math.abs(acc) < 25) return;
      goTo(track, i + Math.sign(acc));
      acc = 0;
      locked = true;
      moveEnd = now + 650;
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    // Room for the caption: the body sits right of centre on desktop.
    const offset = (stop: Stop) => {
      const n = narrowRef.current;
      if (stop.id === "app") return n ? { x: 0, y: -0.18 } : { x: -0.2, y: 0 };
      return n ? { x: 0, y: -0.06 } : { x: 0.12, y: 0 };
    };

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (!scene?.loaded) return;
      const settled = activeStop(trackRef.current);
      if (wanted !== null && settled === wanted) wanted = null;
      // Start flying as soon as a flick asks for a stop, not when the page
      // has scrolled half way there.
      const target = wanted ?? settled;
      if (target !== to) {
        // A new stop: fly there from wherever the camera is now.
        from = shown;
        to = target;
        startT = t;
        const steps = Math.abs(to - from);
        const slow =
          steps <= 1 && (to === CHANGE_START + 1 || Math.round(from) === CHANGE_START + 1);
        duration = reduced ? 0 : (slow ? CHANGE_MS : MOVE_MS) * Math.sqrt(Math.max(steps, 0.4));
        // The visitor's drag-spin eases back on the way.
        spin *= 0.5;
      }
      const u = duration > 0 ? Math.min(1, (t - startT) / duration) : 1;
      shown = from + (to - from) * u;
      if (!dragging && u >= 1 && Math.abs(spin) > 0.0005) spin *= 0.92;

      // Nothing moved: skip the frame entirely.
      if (!dirty && shown === lastShown && spin === lastSpin) return;
      dirty = false;
      lastShown = shown;
      lastSpin = spin;

      const frame = frameAt(shown, scene.centers, offset);
      scene.apply(frame, spin);
      scene.render();

      const w = canvas.clientWidth;
      STOPS.forEach((stop, i) => {
        const v = visibility(shown, i);
        const cap = captionRefs.current[i];
        if (cap) {
          cap.style.opacity = String(v);
          cap.style.transform = `translateY(${(1 - v) * 24}px)`;
          cap.style.visibility = v > 0.01 ? "visible" : "hidden";
        }
        stop.pins.forEach((pin, j) => {
          const el = pinRefs.current[i]?.[j];
          if (!el) return;
          const pos = v > 0.01 ? scene!.project(pin.anchor) : null;
          const pv = pos && pos.front && pos.onScreen ? v : 0;
          el.style.opacity = String(pv);
          el.style.visibility = pv > 0.01 ? "visible" : "hidden";
          if (!pos) return;
          el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
          // Card on the side of the body with more room, kept on screen.
          const card = el.querySelector<HTMLElement>(".pin-card");
          const line = el.querySelector<HTMLElement>(".pin-line");
          if (!card || !line) return;
          // Measure once: reading layout every frame would stall scrolling.
          let cw = cardWidths.get(card);
          if (cw === undefined) {
            cw = card.offsetWidth;
            cardWidths.set(card, cw);
          }
          const gap = 40;
          let want = pos.x < w / 2 ? pos.x - gap - cw : pos.x + gap;
          // On desktop, keep cards out of the caption on the left.
          if (!narrowRef.current && want < CAPTION_RIGHT)
            want = Math.max(pos.x + gap, CAPTION_RIGHT);
          const cardLeft = Math.min(Math.max(want, 8), w - 8 - cw);
          card.style.left = `${cardLeft - pos.x}px`;
          const onRight = cardLeft >= pos.x;
          const len = onRight ? cardLeft - pos.x : pos.x - (cardLeft + cw);
          line.style.width = `${Math.max(0, len)}px`;
          line.style.left = onRight ? "0px" : `${-Math.max(0, len)}px`;
        });
      });

      const tl = Math.max(visibility(shown, CHANGE_START), visibility(shown, CHANGE_START + 1));
      if (timelineRef.current) {
        timelineRef.current.style.opacity = String(tl);
        timelineRef.current.style.visibility = tl > 0.01 ? "visible" : "hidden";
      }
      if (timelineFill.current) timelineFill.current.style.width = `${frame.scan * 100}%`;
      if (timelineFat.current)
        timelineFat.current.textContent = `${(START_FAT + (LATEST_FAT - START_FAT) * frame.scan).toFixed(1)}%`;
      if (hintRef.current) hintRef.current.style.opacity = String(visibility(shown, 0));
    };

    redrawRef.current = () => (dirty = true);
    const resize = () => {
      cardWidths = new WeakMap();
      scene?.resize(canvas.clientWidth, canvas.clientHeight);
      dirty = true;
    };
    const ro = new ResizeObserver(resize);

    import("./body-scene")
      .then(async ({ BodyScene }) => {
        if (disposed) return;
        scene = new BodyScene(canvas);
        sceneRef.current = scene;
        scene.setMood(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        resize();
        ro.observe(canvas);
        await scene.load("/models/body.glb");
        if (disposed) return;
        shown = from = to = activeStop(trackRef.current);
        setStatus("ready");
        raf = requestAnimationFrame(tick);
      })
      .catch(() => !disposed && setStatus("error"));

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("wheel", onWheel);
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  return (
    <div ref={trackRef} className="tour relative">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-grab touch-pan-y active:cursor-grabbing"
          aria-label="3D body with sample DEXA data. Drag to spin it."
        />

        {/* Numbers pinned to the body parts they belong to. */}
        <div className="pointer-events-none absolute inset-0">
          {STOPS.map((stop, i) =>
            stop.pins.map((pin, j) => (
              <div
                key={`${stop.id}-${pin.anchor}`}
                ref={(el) => {
                  (pinRefs.current[i] ??= [])[j] = el;
                }}
                className="absolute top-0 left-0"
                style={{ opacity: 0, visibility: "hidden" }}
              >
                <span className="absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full border-2 border-bg bg-lean shadow-[0_0_0_4px_color-mix(in_srgb,var(--lean)_30%,transparent)]" />
                <span className="pin-line absolute top-0 h-px bg-lean/70" />
                <div className="pin-card absolute top-0 left-10 w-max max-w-[11rem] -translate-y-1/2 rounded-xl border border-outline bg-surface/95 px-3 py-2 shadow-lg sm:max-w-[13rem] sm:px-3.5 sm:py-2.5">
                  <p className="font-hud text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3">
                    {pin.label}
                  </p>
                  <p className="font-display text-lg font-extrabold leading-tight text-ink sm:text-2xl">
                    {pin.value}
                  </p>
                  {pin.note && <p className="text-[11px] text-ink-2 sm:text-xs">{pin.note}</p>}
                </div>
              </div>
            )),
          )}
        </div>

        {/* One caption per stop. */}
        {STOPS.map((stop, i) => (
          <div
            key={stop.id}
            ref={(el) => {
              captionRefs.current[i] = el;
            }}
            className={
              stop.id === "app"
                ? "pointer-events-none absolute inset-x-3 bottom-3 md:inset-x-auto md:top-[calc(50%+2rem)] md:right-[5%] md:bottom-auto md:w-[min(42rem,56vw)] md:-translate-y-1/2"
                : "pointer-events-none absolute inset-x-3 bottom-3 md:inset-x-auto md:top-1/2 md:bottom-auto md:left-10 md:w-[26rem] md:-translate-y-1/2"
            }
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            {stop.id === "app" ? (
              <AppEnding mood={mood} narrow={narrow} />
            ) : (
              <Caption stop={stop} first={i === 0} />
            )}
          </div>
        ))}

        {/* Timeline readout for the change stops. */}
        <div
          ref={timelineRef}
          className="pointer-events-none absolute top-20 left-1/2 w-[min(22rem,88vw)] -translate-x-1/2 rounded-2xl border border-outline bg-surface/95 px-4 py-3 shadow-lg"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-ink-2">
            <span>{SAMPLE_START.date}</span>
            <span>→ {SAMPLE_LATEST.date}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-high">
            <div ref={timelineFill} className="h-full rounded-full bg-lean" style={{ width: 0 }} />
          </div>
          <p className="mt-2 text-center text-xs text-ink-3">
            Body fat{" "}
            <span ref={timelineFat} className="font-display text-base font-extrabold text-ink" />
          </p>
        </div>

        <div
          ref={hintRef}
          className="pointer-events-none absolute top-20 right-0 left-0 hidden text-center text-xs tracking-wide text-ink-3 md:block"
        >
          Scroll to explore · drag to spin
        </div>

        <p className="pointer-events-none absolute top-[4.5rem] right-4 text-[11px] text-ink-3">
          Sample scan data
        </p>

        {status !== "ready" && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-3">
            {status === "loading" ? "Loading the 3D body…" : "This browser can't show the 3D body."}
          </div>
        )}
      </div>
      {/* The track is one screen per stop: the sticky scene above takes the
          first, this spacer the rest. */}
      <div aria-hidden style={{ height: `${LAST * 100}svh` }} />
      {/* One full-screen snap point per stop; the scene shows the active one. */}
      <div className="pointer-events-none absolute inset-x-0 top-0">
        {STOPS.map((stop) => (
          <section
            key={stop.id}
            aria-label={stop.title}
            className="h-[100svh] snap-start snap-always"
          />
        ))}
      </div>
    </div>
  );
}

function Legend({ stop }: { stop: Stop }) {
  if (!stop.legend) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
      {stop.legend.map((l) => (
        <li key={l.label} className="flex items-center gap-1.5 text-xs text-ink-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: rgbCss(l.color) }} />
          {l.label}
        </li>
      ))}
    </ul>
  );
}

function Caption({ stop, first }: { stop: Stop; first: boolean }) {
  const Title = first ? "h1" : "h2";
  return (
    <div className="rounded-2xl border border-outline bg-surface/95 p-4 shadow-xl sm:p-5">
      <p className="font-hud text-[10px] font-semibold uppercase tracking-[0.25em] text-lean sm:text-xs">
        {stop.eyebrow}
      </p>
      <Title
        className={`font-display mt-1.5 font-extrabold tracking-tight text-ink ${first ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"}`}
      >
        {stop.title}
      </Title>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{stop.body}</p>
      {stop.stats && (
        <dl className="mt-3 grid grid-cols-3 gap-2">
          {stop.stats.map((st) => (
            <div key={st.label} className="rounded-xl border border-outline bg-bg/60 px-2.5 py-2">
              <dt className="font-hud text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-3 sm:text-[10px]">
                {st.label}
              </dt>
              <dd className="font-display text-base font-extrabold text-ink sm:text-xl">
                {st.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <Legend stop={stop} />
    </div>
  );
}

function AppEnding({ mood, narrow }: { mood: Mood; narrow: boolean }) {
  const last = STOPS[STOPS.length - 1];
  return (
    <div className="flex items-end gap-3 md:items-center md:gap-8">
      <Phone
        light={mood === "dark" ? screens.home.dark : screens.home.light}
        alt="The app's home screen: the 3D body with body fat, lean mass and visceral fat"
        sizes="260px"
        className={narrow ? "w-[34%] shrink-0" : "h-[min(66vh,520px)] w-auto shrink-0"}
      />
      <div className="pointer-events-auto rounded-2xl border border-outline bg-surface/95 p-4 shadow-xl md:p-5">
        <p className="font-hud text-[10px] font-semibold uppercase tracking-[0.25em] text-lean sm:text-xs">
          {last.eyebrow}
        </p>
        <h2 className="font-display mt-1.5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {last.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{last.body}</p>
        <a
          href="#waitlist"
          className="mt-4 inline-block rounded-full bg-lean px-5 py-2.5 text-sm font-semibold text-on-lean hover:opacity-90"
        >
          Join the beta
        </a>
      </div>
    </div>
  );
}
