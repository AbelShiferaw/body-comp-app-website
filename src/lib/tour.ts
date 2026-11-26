// Data for the interactive tour (/v2): the app's sample scans, the numbers
// shown at each stop, and the stops themselves. All numbers are the app's
// sample data (body_mapping's sampleTimeline), computed the way the app
// computes them, and the page labels them as sample data.

export const SLOT_COUNT = 8;
/** Region mask slots of body.glb, in order. */
export const SLOTS = [
  "armL",
  "armR",
  "legL",
  "legR",
  "trunk",
  "head",
  "android",
  "gynoid",
] as const;
export type Slot = (typeof SLOTS)[number];

export type Mood = "bright" | "cinematic";
export type MoodSetting = Mood | "system";
export type Motion = "fly" | "turn";
export type Labels = "pinned" | "side";
export type AnchorName = "chest" | "abdomen" | "belly" | "hips" | "armL" | "armR" | "legL" | "legR";
export type Rgb = [number, number, number];
export type Center = "whole" | "belly" | "arms" | "legs";

// --- Sample scans ---------------------------------------------------------

type Mass = { lean: number; fat: number };
export type Scan = {
  date: string;
  regions: Record<"armL" | "armR" | "legL" | "legR" | "trunk", Mass>;
  android: Mass;
  gynoid: Mass;
  head: Mass;
  boneKg: number;
  visceralG: number;
};

function sampleScan(
  date: string,
  arm: [number, number],
  leg: [number, number],
  trunk: [number, number],
  android: [number, number],
  gynoid: [number, number],
  visceralG: number,
): Scan {
  const skew = 0.025;
  const m = ([lean, fat]: [number, number], s = 0): Mass => ({ lean: lean * (1 + s), fat });
  return {
    date,
    regions: {
      armL: m(arm, -skew),
      armR: m(arm),
      legL: m(leg, -skew / 2),
      legR: m(leg),
      trunk: m(trunk),
    },
    android: m(android),
    gynoid: m(gynoid),
    head: { lean: 3.9, fat: 1 },
    boneKg: 3.2,
    visceralG,
  };
}

/** The app's sample timeline: a 178 cm man cutting from ~24% to 17% fat. */
export const SAMPLE_START = sampleScan(
  "Mar 14, 2026",
  [3.75, 1.15],
  [10.45, 3.3],
  [29.5, 10.6],
  [3.2, 2],
  [7.6, 3.1],
  620,
);
export const SAMPLE_LATEST = sampleScan(
  "Nov 7, 2026",
  [4.05, 0.75],
  [10.95, 2.5],
  [30.8, 6.4],
  [3.3, 1.1],
  [8, 2.3],
  340,
);

export function totals(s: Scan) {
  const parts = [...Object.values(s.regions), s.head];
  const fat = parts.reduce((t, r) => t + r.fat, 0);
  const lean = parts.reduce((t, r) => t + r.lean, 0);
  return { fatKg: fat, leanKg: lean, fatPct: (100 * fat) / (fat + lean + s.boneKg) };
}

export const fatPct = (m: Mass) => (100 * m.fat) / (m.fat + m.lean);
export const change = (a: number, b: number) => (b - a) / a;

/** Per-slot values, in SLOTS order. */
function perSlot(s: Scan): Mass[] {
  return [
    s.regions.armL,
    s.regions.armR,
    s.regions.legL,
    s.regions.legR,
    s.regions.trunk,
    s.head,
    s.android,
    s.gynoid,
  ];
}

// --- Heatmap colors (the app's HeatPalette.standard) ------------------------

const hex = (h: number): Rgb => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
const lerpRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
function ramp(stops: [number, Rgb][], x: number): Rgb {
  if (x <= stops[0][0]) return stops[0][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [va, ca] = stops[i];
    const [vb, cb] = stops[i + 1];
    if (x <= vb) return lerpRgb(ca, cb, (x - va) / (vb - va));
  }
  return stops[stops.length - 1][1];
}

export const PALETTE = {
  low: hex(0x7cc4ff),
  mid: hex(0xf6c35b),
  high: hex(0xd9541a),
  progress: hex(0x2b7bd6),
  neutral: hex(0xb8bdc4),
  regress: hex(0xe8822a),
};

export const fatPctColor = (pct: number) =>
  ramp(
    [
      [4, PALETTE.low],
      [12, PALETTE.mid],
      [25, PALETTE.high],
    ],
    pct,
  );
export const fatChangeColor = (rel: number) =>
  ramp(
    [
      [-0.3, PALETTE.progress],
      [0, PALETTE.neutral],
      [0.3, PALETTE.regress],
    ],
    rel,
  );

const NEUTRAL: Rgb[] = Array.from({ length: SLOT_COUNT }, () => PALETTE.neutral);
const FAT_COLORS: Rgb[] = perSlot(SAMPLE_LATEST).map((m) => fatPctColor(fatPct(m)));
const START_SLOTS = perSlot(SAMPLE_START);
const CHANGE_COLORS: Rgb[] = perSlot(SAMPLE_LATEST).map((m, i) =>
  fatChangeColor(change(START_SLOTS[i].fat, m.fat)),
);

// --- Stops -----------------------------------------------------------------

export type View = { center: Center; dy: number; yaw: number; pitch: number; dist: number };
export type Look = {
  heat: number;
  colors: Rgb[];
  highlight: number[];
  fatUp: number;
  muscleUp: number;
  /** 0 = start scan, 1 = latest scan (drives the timeline readout). */
  scan: number;
};
export type Frame = Look & {
  focus: { x: number; y: number; z: number; yaw: number; pitch: number; dist: number };
  swoop: number;
  offsetX: number;
  offsetY: number;
};

export type Pin = { anchor: AnchorName; label: string; value: string; note?: string };
/** A whole-body number: shown in the caption, never pinned to one region. */
export type Stat = { label: string; value: string; note?: string };
export type Stop = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  pins: Pin[];
  stats?: Stat[];
  legend?: { color: Rgb; label: string }[];
  timeline?: boolean;
  view: View;
  look: Look;
};

const hl = (...slots: Slot[]) => SLOTS.map((s) => (slots.includes(s) ? 1 : 0));
const NONE = hl();

const latest = totals(SAMPLE_LATEST);
const start = totals(SAMPLE_START);
const r = SAMPLE_LATEST.regions;
const a = SAMPLE_START.regions;

const kg = (x: number, d = 2) => `${x.toFixed(d)} kg`;
const pct = (x: number, d = 1) => `${x.toFixed(d)}%`;
const signedPct = (rel: number) => `${rel > 0 ? "+" : "−"}${Math.abs(rel * 100).toFixed(0)}%`;

// Shape at the start scan vs the latest one. Rough sample weights, shown
// only as "sample data"; the app solves these from the scan itself.
const START_SHAPE = { fatUp: 0.55, muscleUp: 0 };
const LATEST_SHAPE = { fatUp: 0.12, muscleUp: 0.18 };

const studio = (highlight = NONE): Look => ({
  heat: 0,
  colors: NEUTRAL,
  highlight,
  ...LATEST_SHAPE,
  scan: 1,
});

const FAT_LEGEND = [
  { color: PALETTE.high, label: "25% fat" },
  { color: PALETTE.mid, label: "12%" },
  { color: PALETTE.low, label: "4%" },
];

export const STOPS: Stop[] = [
  {
    id: "intro",
    eyebrow: "The app · iPhone and Android · private beta",
    title: "Your DEXA scan, in 3D.",
    body: "Obsessed turns your DEXA results into a 3D body built from your own numbers. Scroll to explore one.",
    // Whole-body totals go in the caption: pinning them to one body part
    // would read as that part's number.
    pins: [],
    stats: [
      { label: "Body fat", value: pct(latest.fatPct) },
      { label: "Lean mass", value: kg(latest.leanKg, 1) },
      { label: "Visceral fat", value: `${SAMPLE_LATEST.visceralG} g` },
    ],
    view: { center: "arms", dy: 2.2, yaw: 0.25, pitch: 0.04, dist: 15 },
    look: studio(),
  },
  {
    id: "arms",
    eyebrow: "Arms",
    title: "Lean mass, arm by arm.",
    body: "See lean mass for each arm and spot the side that lags behind, straight from your scan's left and right numbers.",
    pins: [
      { anchor: "armR", label: "Right arm", value: kg(r.armR.lean), note: "lean mass" },
      {
        anchor: "armL",
        label: "Left arm",
        value: kg(r.armL.lean),
        note: `${pct((100 * (r.armR.lean - r.armL.lean)) / r.armR.lean)} behind the right`,
      },
    ],
    view: { center: "arms", dy: 0, yaw: -0.5, pitch: 0.08, dist: 14 },
    look: studio(hl("armL", "armR")),
  },
  {
    id: "belly",
    eyebrow: "Belly",
    title: "Fat where you actually carry it.",
    body: "Your scan measures fat region by region, so the belly gets its own number, plus visceral fat: the fat packed around your organs.",
    pins: [
      {
        anchor: "belly",
        label: "Belly fat",
        value: kg(SAMPLE_LATEST.android.fat),
        note: `${pct(fatPct(SAMPLE_LATEST.android))} of the belly`,
      },
      {
        anchor: "abdomen",
        label: "Visceral fat",
        value: `${SAMPLE_LATEST.visceralG} g`,
        note: `−${SAMPLE_START.visceralG - SAMPLE_LATEST.visceralG} g since Mar`,
      },
    ],
    view: { center: "belly", dy: 0, yaw: 0.3, pitch: 0.12, dist: 10 },
    look: studio(hl("android")),
  },
  {
    id: "fat",
    eyebrow: "Fat view",
    title: "Your body, colored by your fat.",
    body: "Switch to the Fat view and every region takes the color of its own fat percentage. Tap a region in the app for its numbers.",
    pins: [
      { anchor: "belly", label: "Belly", value: pct(fatPct(SAMPLE_LATEST.android)) },
      { anchor: "hips", label: "Hips", value: pct(fatPct(SAMPLE_LATEST.gynoid)) },
      { anchor: "legL", label: "Left leg", value: pct(fatPct(r.legL)) },
    ],
    legend: FAT_LEGEND,
    view: { center: "belly", dy: -1.3, yaw: -0.3, pitch: 0.06, dist: 15 },
    look: { heat: 1, colors: FAT_COLORS, highlight: NONE, ...LATEST_SHAPE, scan: 1 },
  },
  {
    id: "legs",
    eyebrow: "Legs",
    title: "Leg day shows up in the data.",
    body: "Lean and fat for each leg, every scan, so you can see what your training actually built. The colors are still the Fat view.",
    pins: [
      {
        anchor: "legR",
        label: "Right leg",
        value: kg(r.legR.lean),
        note: `+${kg(r.legR.lean - a.legR.lean)} since Mar`,
      },
      {
        anchor: "legL",
        label: "Left leg",
        value: kg(r.legL.lean),
        note: `+${kg(r.legL.lean - a.legL.lean)} since Mar`,
      },
    ],
    legend: FAT_LEGEND,
    view: { center: "legs", dy: 0.6, yaw: 0.35, pitch: -0.1, dist: 13 },
    look: { heat: 1, colors: FAT_COLORS, highlight: NONE, ...LATEST_SHAPE, scan: 1 },
  },
  {
    id: "change-start",
    eyebrow: "Change view",
    title: "Pick any two scans.",
    body: `Here's the sample body on ${SAMPLE_START.date}, at ${pct(start.fatPct)} body fat. Keep scrolling to move to the latest scan.`,
    pins: [],
    timeline: true,
    view: { center: "belly", dy: -1.5, yaw: 0.1, pitch: 0.04, dist: 22 },
    look: { heat: 1, colors: NEUTRAL, highlight: NONE, ...START_SHAPE, scan: 0 },
  },
  {
    id: "change-end",
    eyebrow: "Change view",
    title: "See exactly what changed.",
    body: `Blue is fat lost. ${SAMPLE_START.date.slice(0, 6)} to ${SAMPLE_LATEST.date.slice(0, 5)}: −${(start.fatKg - latest.fatKg).toFixed(1)} kg fat, +${(latest.leanKg - start.leanKg).toFixed(1)} kg lean, ${pct(start.fatPct)} → ${pct(latest.fatPct)} body fat.`,
    pins: [
      {
        anchor: "belly",
        label: "Belly fat",
        value: signedPct(change(SAMPLE_START.android.fat, SAMPLE_LATEST.android.fat)),
      },
      { anchor: "armR", label: "Right arm fat", value: signedPct(change(a.armR.fat, r.armR.fat)) },
      { anchor: "legL", label: "Left leg fat", value: signedPct(change(a.legL.fat, r.legL.fat)) },
    ],
    legend: [
      { color: PALETTE.regress, label: "+30% fat" },
      { color: PALETTE.neutral, label: "no change" },
      { color: PALETTE.progress, label: "−30% fat" },
    ],
    timeline: true,
    view: { center: "belly", dy: -1.5, yaw: -0.1, pitch: 0.04, dist: 20 },
    look: { heat: 1, colors: CHANGE_COLORS, highlight: NONE, ...LATEST_SHAPE, scan: 1 },
  },
  {
    id: "app",
    eyebrow: "The app",
    title: "All of it, in your pocket.",
    body: "Every scan you take becomes a level. Join the private beta to get the app on iPhone or Android first.",
    pins: [],
    view: { center: "whole", dy: 0, yaw: 0.5, pitch: 0.04, dist: 42 },
    look: studio(),
  },
];

// --- Interpolation -----------------------------------------------------------

const lerp = (x: number, y: number, t: number) => x + (y - x) * t;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => x * x * (3 - 2 * x);

/** Share of each scroll segment spent holding still at a stop. */
export const HOLD = 0.16;

/** Eased progress between stop k and k+1 for raw scroll progress p. */
export function segment(p: number, count = STOPS.length) {
  const max = count - 1;
  const q = Math.min(Math.max(p, 0), max);
  const k = Math.min(Math.floor(q), max - 1);
  const f = q - k;
  const e = smooth(clamp01((f - HOLD) / (1 - 2 * HOLD)));
  return { k, e };
}

/** How visible stop i's text is at progress p (1 while holding there). */
export function visibility(p: number, i: number) {
  return clamp01(1 - (Math.abs(p - i) - HOLD) / 0.3);
}

export function lerpLook(x: Look, y: Look, t: number): Look {
  return {
    heat: lerp(x.heat, y.heat, t),
    colors: x.colors.map((c, i) => lerpRgb(c, y.colors[i], t)),
    highlight: x.highlight.map((h, i) => lerp(h, y.highlight[i], t)),
    fatUp: lerp(x.fatUp, y.fatUp, t),
    muscleUp: lerp(x.muscleUp, y.muscleUp, t),
    scan: lerp(x.scan, y.scan, t),
  };
}

export type Vec = { x: number; y: number; z: number };

/** The scene frame at scroll progress p. */
export function frameAt(
  p: number,
  centers: Record<Center, Vec>,
  offset: (stop: Stop) => { x: number; y: number },
): Frame {
  const { k, e } = segment(p);
  const s0 = STOPS[k];
  const s1 = STOPS[k + 1];
  const c0 = centers[s0.view.center];
  const c1 = centers[s1.view.center];
  const o0 = offset(s0);
  const o1 = offset(s1);
  // Only swoop between stops that frame different regions.
  const swoop = s0.view.center !== s1.view.center ? Math.sin(Math.PI * e) : 0;
  return {
    ...lerpLook(s0.look, s1.look, e),
    focus: {
      x: lerp(c0.x, c1.x, e),
      y: lerp(c0.y + s0.view.dy, c1.y + s1.view.dy, e),
      z: lerp(c0.z, c1.z, e),
      yaw: lerp(s0.view.yaw, s1.view.yaw, e),
      pitch: lerp(s0.view.pitch, s1.view.pitch, e),
      dist: lerp(s0.view.dist, s1.view.dist, e),
    },
    swoop,
    offsetX: lerp(o0.x, o1.x, e),
    offsetY: lerp(o0.y, o1.y, e),
  };
}

export const rgbCss = ([r, g, b]: Rgb) =>
  `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)})`;
