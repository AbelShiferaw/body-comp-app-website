"use client";

// The interactive tour: a sticky 3D body that scrolling moves through the
// stops in src/lib/tour.ts. Three switches (motion, labels, mood) let us
// compare versions side by side; picks live in the URL and localStorage.
import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";

import { screens } from "@/lib/screens";
import {
  frameAt,
  lerpLook,
  rgbCss,
  SAMPLE_LATEST,
  SAMPLE_START,
  segment,
  STOPS,
  totals,
  visibility,
  type Labels,
  type Mood,
  type MoodSetting,
  type Motion,
  type Stop,
} from "@/lib/tour";
import { Phone } from "../phone";
import type { BodyScene } from "./body-scene";

const SEGMENT_VH = 170;
/** Right edge (px) of the pinned-mode caption on desktop: left-10 + 26rem + a gap. */
const CAPTION_RIGHT = 40 + 416 + 16;
const START_FAT = totals(SAMPLE_START).fatPct;
const LATEST_FAT = totals(SAMPLE_LATEST).fatPct;

// --- Settings ----------------------------------------------------------------

function useSetting<T extends string>(key: string, options: readonly T[], fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get(key);
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(`v2.${key}`);
    } catch {}
    const pick = [fromUrl, stored].find((v): v is T => !!v && options.includes(v as T));
    // Reads browser-only state (URL, storage) after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pick) setValue(pick);
  }, [key, options]);
  const set = (v: T) => {
    setValue(v);
    try {
      localStorage.setItem(`v2.${key}`, v);
    } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set(key, v);
    window.history.replaceState(null, "", url);
  };
  return [value, set] as const;
}

const MOTIONS = ["fly", "turn"] as const;
const LABELS = ["pinned", "side"] as const;
const MOODS = ["bright", "cinematic", "system"] as const;
const PHONES = ["full", "lite"] as const;
type PhoneVersion = (typeof PHONES)[number];

/** Lite version: the app screen shown at each stop instead of the 3D body. */
const LITE_SCREENS: Record<string, { light?: StaticImageData; dark?: StaticImageData } | null> = {
  intro: screens.home,
  belly: screens.fat,
  arms: screens.home,
  legs: screens.home,
  fat: screens.fat,
  "change-start": screens.home,
  "change-end": screens.change,
  app: null,
};
const liteShot = (id: string, mood: Mood) => {
  const s = LITE_SCREENS[id];
  if (!s) return null;
  return mood === "cinematic" ? (s.dark ?? s.light!) : (s.light ?? s.dark!);
};

function useResolvedMood(setting: MoodSetting): Mood {
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  if (setting === "system") return systemDark ? "cinematic" : "bright";
  return setting;
}

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return narrow;
}

// --- Tour --------------------------------------------------------------------

export function Tour() {
  const [motion, setMotion] = useSetting<Motion>("motion", MOTIONS, "fly");
  const [labels, setLabels] = useSetting<Labels>("labels", LABELS, "pinned");
  const [moodSetting, setMood] = useSetting<MoodSetting>("mood", MOODS, "system");
  const [phone, setPhone] = useSetting<PhoneVersion>("phone", PHONES, "full");
  const lite = phone === "lite";
  const mood = useResolvedMood(moodSetting);
  const narrow = useNarrow();
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
  const liteRefs = useRef<(HTMLDivElement | null)[]>([]);
  const liteFrameRef = useRef<HTMLDivElement>(null);
  const settings = useRef({ labels, narrow });
  useEffect(() => {
    settings.current = { labels, narrow };
  }, [labels, narrow]);

  // Mood sets the page tokens too (see globals.css).
  useEffect(() => {
    document.documentElement.dataset.mood = mood;
    sceneRef.current?.setMood(mood);
  }, [mood]);
  useEffect(() => () => void delete document.documentElement.dataset.mood, []);
  useEffect(() => sceneRef.current?.setMotion(motion), [motion]);

  // Scene setup and the render loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    let disposed = false;
    let raf = 0;
    let scene: BodyScene | null = null;
    let spin = 0;
    let dragging = false;
    let lastX = 0;
    let smoothP = 0;
    let lastRawP = 0;
    let lastT = 0;
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

    // Snap: when scrolling stops between two stops, glide to the nearest
    // one so the page never rests half way through a transition.
    let snapTimer = 0;
    let touching = false;
    const snap = () => {
      const track = trackRef.current;
      if (!track || dragging || touching) return;
      const rect = track.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      if (range <= 0 || scrolled <= 0 || scrolled >= range) return;
      const p = (scrolled / range) * (STOPS.length - 1);
      const target = Math.round(p);
      if (Math.abs(p - target) < 0.004) return;
      const delta = (target / (STOPS.length - 1)) * range - scrolled;
      window.scrollTo({ top: window.scrollY + delta, behavior: reduced ? "auto" : "smooth" });
    };
    const onScroll = () => {
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snap, 180);
    };
    const onTouchStart = () => (touching = true);
    const onTouchEnd = () => {
      touching = false;
      onScroll();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    canvas?.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    const progress = () => {
      const track = trackRef.current;
      if (!track) return 0;
      const rect = track.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      return range > 0 ? (Math.min(Math.max(-rect.top, 0), range) / range) * (STOPS.length - 1) : 0;
    };

    const offset = (stop: Stop) => {
      const { labels: l, narrow: n } = settings.current;
      if (stop.id === "app") return n ? { x: 0, y: -0.18 } : { x: -0.2, y: 0 };
      if (l === "side") return n ? { x: 0, y: -0.16 } : { x: 0.2, y: 0 };
      return n ? { x: 0, y: -0.06 } : { x: 0.12, y: 0 };
    };

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (!lite && !scene?.loaded) return;
      const raw = progress();
      // Frame-rate independent easing toward the scroll position.
      const dt = lastT ? Math.min((t - lastT) / 1000, 0.25) : 0;
      lastT = t;
      smoothP += (raw - smoothP) * (reduced ? 1 : 1 - Math.exp(-dt * 3.5));
      if (Math.abs(smoothP - raw) < 0.0005) smoothP = raw;
      // Scrolling again eases a dragged spin back to the stop's own angle.
      if (!dragging && Math.abs(raw - lastRawP) > 0.0005) spin *= 0.9;
      lastRawP = raw;

      let scan: number;
      if (scene) {
        const frame = frameAt(smoothP, scene.centers, offset);
        const idle = reduced ? 0 : 0.18 * Math.sin(t / 2400) * visibility(smoothP, 0);
        scene.apply(frame, spin + idle);
        scene.render();
        scan = frame.scan;
      } else {
        const { k, e } = segment(smoothP);
        scan = lerpLook(STOPS[k].look, STOPS[k + 1].look, e).scan;
      }

      const { labels: l } = settings.current;
      const w = canvas?.clientWidth ?? window.innerWidth;
      STOPS.forEach((stop, i) => {
        const v = visibility(smoothP, i);
        const shot = liteRefs.current[i];
        if (shot) shot.style.opacity = String(v);
        const cap = captionRefs.current[i];
        if (cap) {
          cap.style.opacity = String(v);
          cap.style.transform = `translateY(${(1 - v) * 24}px)`;
          cap.style.visibility = v > 0.01 ? "visible" : "hidden";
        }
        stop.pins.forEach((pin, j) => {
          const el = pinRefs.current[i]?.[j];
          if (!el) return;
          const pos = scene && l === "pinned" && v > 0.01 ? scene.project(pin.anchor) : null;
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
          if (!settings.current.narrow && want < CAPTION_RIGHT)
            want = Math.max(pos.x + gap, CAPTION_RIGHT);
          const cardLeft = Math.min(Math.max(want, 8), w - 8 - cw);
          card.style.left = `${cardLeft - pos.x}px`;
          const onRight = cardLeft >= pos.x;
          const len = onRight ? cardLeft - pos.x : pos.x - (cardLeft + cw);
          line.style.width = `${Math.max(0, len)}px`;
          line.style.left = onRight ? "0px" : `${-Math.max(0, len)}px`;
        });
      });

      const tl = Math.max(visibility(smoothP, 5), visibility(smoothP, 6));
      if (timelineRef.current) {
        timelineRef.current.style.opacity = String(tl);
        timelineRef.current.style.visibility = tl > 0.01 ? "visible" : "hidden";
      }
      if (timelineFill.current) timelineFill.current.style.width = `${scan * 100}%`;
      if (timelineFat.current)
        timelineFat.current.textContent = `${(START_FAT + (LATEST_FAT - START_FAT) * scan).toFixed(1)}%`;
      if (liteFrameRef.current)
        liteFrameRef.current.style.opacity = String(1 - visibility(smoothP, STOPS.length - 1));
      if (hintRef.current) hintRef.current.style.opacity = String(visibility(smoothP, 0));
    };

    const resize = () => {
      cardWidths = new WeakMap();
      if (canvas) scene?.resize(canvas.clientWidth, canvas.clientHeight);
    };
    const ro = new ResizeObserver(resize);

    // Status follows the version: lite is ready at once, 3D after loading.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(lite ? "ready" : "loading");
    if (lite || !canvas) {
      // Lite: no 3D, so no three.js or body model to download.
      smoothP = progress();
      raf = requestAnimationFrame(tick);
    } else
      import("./body-scene")
        .then(async ({ BodyScene }) => {
          if (disposed) return;
          scene = new BodyScene(canvas);
          sceneRef.current = scene;
          scene.setMood(
            document.documentElement.dataset.mood === "cinematic" ? "cinematic" : "bright",
          );
          resize();
          ro.observe(canvas);
          await scene.load("/models/body.glb");
          if (disposed) return;
          smoothP = progress();
          setStatus("ready");
          raf = requestAnimationFrame(tick);
        })
        .catch(() => !disposed && setStatus("error"));

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas?.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.clearTimeout(snapTimer);
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [lite]);

  // Keep the scene in step with settings that change after it loads.
  useEffect(() => {
    if (status !== "ready") return;
    sceneRef.current?.setMotion(motion);
    sceneRef.current?.setMood(mood);
  }, [status, motion, mood]);

  // Lite has no body to pin numbers to, so it always uses side panels.
  const side = lite || labels === "side";

  return (
    <>
      <div
        ref={trackRef}
        className="relative"
        style={{ height: `${(STOPS.length - 1) * SEGMENT_VH + 100}vh` }}
      >
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
          {lite ? (
            <div
              ref={liteFrameRef}
              className="pointer-events-none absolute inset-x-0 top-24 flex justify-center md:inset-y-0 md:top-8 md:right-[8%] md:left-auto md:items-center"
            >
              <div className="relative aspect-[390/844] h-[min(46svh,520px)] rounded-[2.2rem] border-[8px] border-[#16181c] bg-[#16181c] shadow-2xl shadow-black/25 md:h-[min(72vh,600px)]">
                <div className="relative h-full w-full overflow-hidden rounded-[1.7rem]">
                  {STOPS.map((stop, i) => {
                    const shot = liteShot(stop.id, mood);
                    return shot ? (
                      <div
                        key={stop.id}
                        ref={(el) => {
                          liteRefs.current[i] = el;
                        }}
                        className="absolute inset-0"
                        style={{ opacity: i === 0 ? 1 : 0 }}
                      >
                        <Image
                          src={shot}
                          alt=""
                          sizes="300px"
                          priority={i === 0}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          ) : (
            <canvas
              key="canvas"
              ref={canvasRef}
              className="absolute inset-0 h-full w-full cursor-grab touch-pan-y active:cursor-grabbing"
              aria-label="3D body with sample DEXA data. Drag to spin it."
            />
          )}

          {/* Pins: numbers on the body (labels = pinned). */}
          <div className="pointer-events-none absolute inset-0" aria-hidden={side}>
            {STOPS.map((stop, i) =>
              stop.pins.map((pin, j) => (
                <div
                  key={`${stop.id}-${pin.anchor}`}
                  ref={(el) => {
                    (pinRefs.current[i] ??= [])[j] = el;
                  }}
                  className="pin group absolute top-0 left-0"
                  style={{ opacity: 0, visibility: "hidden" }}
                >
                  <span className="absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full border-2 border-bg bg-lean shadow-[0_0_0_4px_color-mix(in_srgb,var(--lean)_30%,transparent)]" />
                  <span className="pin-line absolute top-0 h-px bg-lean/70" />
                  <div className="pin-card absolute top-0 left-10 w-max max-w-[11rem] -translate-y-1/2 rounded-xl border border-outline bg-surface/90 px-3 py-2 shadow-lg backdrop-blur-md sm:max-w-[13rem] sm:px-3.5 sm:py-2.5">
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

          {/* Captions: one per stop. Pinned = compact caption; side = full panel. */}
          {STOPS.map((stop, i) => (
            <div
              key={stop.id}
              ref={(el) => {
                captionRefs.current[i] = el;
              }}
              className={
                stop.id === "app"
                  ? "pointer-events-none absolute inset-x-3 bottom-3 md:inset-x-auto md:top-[calc(50%+2rem)] md:right-[5%] md:bottom-auto md:w-[min(42rem,56vw)] md:-translate-y-1/2"
                  : side
                    ? "pointer-events-none absolute inset-x-3 bottom-3 md:inset-x-auto md:top-1/2 md:bottom-auto md:left-[6%] md:w-[min(30rem,38vw)] md:-translate-y-1/2"
                    : "pointer-events-none absolute inset-x-3 bottom-3 md:inset-x-auto md:top-1/2 md:bottom-auto md:left-10 md:w-[26rem] md:-translate-y-1/2"
              }
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              {stop.id === "app" ? (
                <AppEnding mood={mood} narrow={narrow} />
              ) : (
                <Caption stop={stop} side={side} first={i === 0} />
              )}
            </div>
          ))}

          {/* Timeline readout for the change stops. */}
          <div
            ref={timelineRef}
            className="pointer-events-none absolute top-28 left-1/2 w-[min(22rem,88vw)] md:top-20 -translate-x-1/2 rounded-2xl border border-outline bg-surface/90 px-4 py-3 shadow-lg backdrop-blur-md"
            style={{ opacity: 0, visibility: "hidden" }}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-ink-2">
              <span>{SAMPLE_START.date}</span>
              <span>→ {SAMPLE_LATEST.date}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-high">
              <div
                ref={timelineFill}
                className="h-full rounded-full bg-lean"
                style={{ width: 0 }}
              />
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
            {lite ? "Scroll to explore" : "Scroll to explore · drag to spin"}
          </div>

          <p className="pointer-events-none absolute top-[4.5rem] right-4 text-[11px] text-ink-3">
            Sample scan data
          </p>

          {status !== "ready" && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-3">
              {status === "loading"
                ? "Loading the 3D body…"
                : "This browser can't show the 3D body."}
            </div>
          )}
        </div>
      </div>

      <VersionPanel
        motion={motion}
        setMotion={setMotion}
        labels={labels}
        setLabels={setLabels}
        mood={moodSetting}
        setMood={setMood}
        phone={phone}
        setPhone={setPhone}
      />
    </>
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

function Caption({ stop, side, first }: { stop: Stop; side: boolean; first: boolean }) {
  const Title = first ? "h1" : "h2";
  if (!side) {
    return (
      <div className="rounded-2xl border border-outline bg-surface/85 p-4 shadow-xl backdrop-blur-md sm:p-5">
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
  return (
    <div className="rounded-2xl border border-outline bg-surface/90 p-5 shadow-xl backdrop-blur-md md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
      <p className="font-hud text-[10px] font-semibold uppercase tracking-[0.25em] text-lean sm:text-xs">
        {stop.eyebrow}
      </p>
      <Title
        className={`font-display mt-2 font-extrabold tracking-tight text-ink ${first ? "text-3xl md:text-6xl" : "text-2xl md:text-5xl"}`}
      >
        {stop.title}
      </Title>
      <p className="mt-3 text-sm leading-relaxed text-ink-2 md:mt-5 md:text-lg">{stop.body}</p>
      {(stop.stats?.length || stop.pins.length > 0) && (
        <dl className="mt-4 grid grid-cols-2 gap-2 md:mt-8 md:gap-3">
          {[...(stop.stats ?? []), ...stop.pins].map((p) => (
            <div
              key={p.label}
              className="rounded-xl border border-outline bg-surface/80 px-3 py-2 md:px-4 md:py-3"
            >
              <dt className="font-hud text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3">
                {p.label}
              </dt>
              <dd className="font-display text-lg font-extrabold text-ink md:text-2xl">
                {p.value}
              </dd>
              {p.note && <dd className="text-[11px] text-ink-2 md:text-xs">{p.note}</dd>}
            </div>
          ))}
        </dl>
      )}
      <Legend stop={stop} />
    </div>
  );
}

function AppEnding({ mood, narrow }: { mood: Mood; narrow: boolean }) {
  const shot = mood === "cinematic" ? screens.home.dark : screens.home.light;
  return (
    <div className="flex items-end gap-3 md:items-center md:gap-8">
      <Phone
        light={shot}
        alt="The app's home screen: the 3D body with body fat, lean mass and visceral fat"
        sizes="260px"
        className={narrow ? "w-[34%] shrink-0" : "h-[min(66vh,520px)] w-auto shrink-0"}
      />
      <div className="pointer-events-auto rounded-2xl border border-outline bg-surface/90 p-4 shadow-xl backdrop-blur-md md:p-5">
        <p className="font-hud text-[10px] font-semibold uppercase tracking-[0.25em] text-lean sm:text-xs">
          {STOPS[STOPS.length - 1].eyebrow}
        </p>
        <h2 className="font-display mt-1.5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {STOPS[STOPS.length - 1].title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{STOPS[STOPS.length - 1].body}</p>
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

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3">
        {label}
      </p>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex rounded-full border border-outline bg-bg p-0.5"
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition ${
              value === o.value ? "bg-lean text-on-lean" : "text-ink-2 hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function VersionPanel(props: {
  motion: Motion;
  setMotion: (v: Motion) => void;
  labels: Labels;
  setLabels: (v: Labels) => void;
  mood: MoodSetting;
  setMood: (v: MoodSetting) => void;
  phone: PhoneVersion;
  setPhone: (v: PhoneVersion) => void;
}) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    // Start collapsed on phones, where the panel would cover the captions.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.matchMedia("(max-width: 767px)").matches) setOpen(false);
  }, []);
  return (
    <div className="fixed top-[4.25rem] left-3 z-40 md:top-auto md:right-5 md:bottom-5 md:left-auto">
      {open ? (
        <div className="w-64 space-y-3 rounded-2xl border border-outline bg-surface/95 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink">Compare versions</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-ink-3 hover:text-ink"
              aria-label="Hide the version switches"
            >
              Hide
            </button>
          </div>
          <Segmented
            label="Motion"
            value={props.motion}
            onChange={props.setMotion}
            options={[
              { value: "fly", label: "Camera flies" },
              { value: "turn", label: "Body turns" },
            ]}
          />
          <Segmented
            label="Labels"
            value={props.labels}
            onChange={props.setLabels}
            options={[
              { value: "pinned", label: "Pinned cards" },
              { value: "side", label: "Side panels" },
            ]}
          />
          <Segmented
            label="Mood"
            value={props.mood}
            onChange={props.setMood}
            options={[
              { value: "bright", label: "Bright" },
              { value: "cinematic", label: "Cinematic" },
              { value: "system", label: "System" },
            ]}
          />
          <Segmented
            label="Phone version (preview at any width)"
            value={props.phone}
            onChange={props.setPhone}
            options={[
              { value: "full", label: "Full 3D" },
              { value: "lite", label: "Lite, no 3D" },
            ]}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-outline bg-surface/95 px-4 py-2 text-xs font-semibold text-ink shadow-lg"
        >
          Versions
        </button>
      )}
    </div>
  );
}
