import Link from "next/link";

import { ScanCompare } from "./scan-compare";

function SectionHeading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="font-hud text-xs font-semibold uppercase tracking-[0.25em] text-lean">
        {eyebrow}
      </p>
      <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {intro && <p className="mt-4 text-lg leading-relaxed text-ink-2">{intro}</p>}
    </div>
  );
}

const STEPS = [
  {
    title: "Get a DEXA scan",
    body: "DEXA is the gold standard for body composition: fat, lean mass and bone, measured for your arms, legs and trunk. Most scans take about ten minutes.",
  },
  {
    title: "Connect your scans",
    body: "Sign in to your DEXA provider in the app and your scans sync straight to your phone. BodySpec comes first; more providers and PDF upload follow.",
  },
  {
    title: "Watch your avatar change",
    body: "Your 3D body is shaped by your own numbers. Scan again in a few months and see the difference: on the body, not in a spreadsheet.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-y border-outline bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="How it works"
          title="From scan report to a body you can see."
          intro="A DEXA report is a page of numbers. Obsessed turns it into something you actually want to open."
        />
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-outline bg-bg p-6">
              <span className="font-hud text-sm font-semibold text-lean">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-bold text-ink">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FEATURES: { title: string; body: string; tone: "lean" | "fat" }[] = [
  {
    title: "Fat where you actually carry it",
    body: "Regional fat from your scan shapes the avatar. High belly fat shows on the belly, not spread evenly over a generic body.",
    tone: "fat",
  },
  {
    title: "Muscle that grows with you",
    body: "Lean mass per region drives visible muscle. Put two kilos on and watch your arms, chest and legs fill out.",
    tone: "lean",
  },
  {
    title: "Levels from real progress",
    body: "Every scan is a level and milestones come from your real changes. No made-up scores: every stat is a DEXA number.",
    tone: "lean",
  },
  {
    title: "Compare any two scans",
    body: "Scrub between scans and see change colored by meaning: ice for muscle gained and fat lost, ember for the opposite.",
    tone: "lean",
  },
  {
    title: "Left vs right balance",
    body: "Spot the arm or leg that lags behind, from your scan's own left and right numbers.",
    tone: "lean",
  },
  {
    title: "Visceral fat and bone, too",
    body: "See visceral fat and bone density exactly as your scan reports them. Informational only, never a diagnosis.",
    tone: "fat",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Built for lifters"
        title="Your body, rendered from your data."
        intro="Bulk, cut or recomp: the scale can't tell muscle from fat. Your DEXA can, and now you can see it."
      />
      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <li key={f.title} className="rounded-2xl border border-outline bg-surface p-6">
            <span
              aria-hidden
              className={`block h-1.5 w-10 rounded-full ${f.tone === "lean" ? "bg-lean" : "bg-fat"}`}
            />
            <h3 className="mt-4 text-lg font-bold text-ink">{f.title}</h3>
            <p className="mt-2 leading-relaxed text-ink-2">{f.body}</p>
          </li>
        ))}
      </ul>
      <div className="mt-20">
        <ScanCompare />
      </div>
    </section>
  );
}

const PROMISES = [
  "Your health data is used to run the app for you. We never sell it.",
  "You give separate, explicit consent before we store DEXA results or body photos.",
  "Your DEXA provider sign-in stays on your phone, not on our servers.",
  "Helping improve our models is opt-in, off by default, and you can turn it off any time.",
  "Delete your account and your data from inside the app.",
];

export function PrivacyPromise() {
  return (
    <section className="border-y border-outline bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <SectionHeading
          eyebrow="Privacy"
          title="Your body data stays yours."
          intro="Body scans and photos are about as personal as data gets. We built Obsessed around that."
        />
        <ul className="space-y-4">
          {PROMISES.map((p) => (
            <li key={p} className="flex gap-3 text-ink-2">
              <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lean" />
              <span className="leading-relaxed">{p}</span>
            </li>
          ))}
          <li className="pt-2 text-sm">
            <Link href="/privacy" className="font-semibold text-lean hover:underline">
              Read the privacy policy (draft)
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "What is a DEXA scan?",
    a: "DEXA (dual-energy X-ray absorptiometry) is a low-dose scan that measures fat, lean mass and bone for each region of your body. It is the most detailed body composition test most people can book.",
  },
  {
    q: "Which DEXA providers do you support?",
    a: "BodySpec first. We are adding providers one at a time, plus PDF upload for scans from other clinics.",
  },
  {
    q: "I don't have a DEXA scan yet. Can I still use it?",
    a: "We're working on a photo-based estimate so you can start without a scan, then calibrate it with DEXA later. Join the waitlist and we'll tell you when it's ready.",
  },
  {
    q: "How much will it cost?",
    a: "Your 3D body will be free. History, comparisons and other Pro features will be a subscription; pricing will be announced before launch. Beta testers use it free.",
  },
  {
    q: "When can I get it?",
    a: "We're starting with a small, invite-only beta in the US on iPhone and Android. Join the waitlist to get an invite.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
      <SectionHeading eyebrow="FAQ" title="Questions, answered." />
      <div className="mt-10 divide-y divide-outline border-y border-outline">
        {FAQS.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-ink">
              {f.q}
              <span aria-hidden className="text-ink-3 transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 leading-relaxed text-ink-2">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
