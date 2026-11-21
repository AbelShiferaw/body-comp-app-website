import Link from "next/link";

import { screens } from "@/lib/screens";
import { Phone } from "./phone";

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
    title: "Connect your scans",
    body: "Sign in to your DEXA provider inside the app and your scans sync to your phone. BodySpec comes first; more providers and PDF upload follow.",
    screen: screens.connect,
    alt: "Onboarding screen: connect BodySpec or estimate from photos",
  },
  {
    title: "Meet your body",
    body: "Your home screen is a 3D body built from your own numbers, with body fat, lean mass and visceral fat on top. Every scan is a level.",
    screen: screens.home,
    alt: "Home screen with level, stats and the 3D body",
  },
  {
    title: "See what changed",
    body: "Pick any two scans. The body shows where you lost or gained fat, region by region, and a lean view shows where you built.",
    screen: screens.change,
    alt: "Change view: fat lost shown in blue on the 3D body",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-y border-outline bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="How the app works"
          title="From scan report to a body you can see."
          intro="A DEXA report is a page of numbers. The Obsessed app turns it into something you actually want to open."
        />
        <ol className="mt-14 grid gap-14 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col items-center text-center">
              <Phone {...step.screen} alt={step.alt} sizes="260px" className="w-[230px]" />
              <span className="font-hud mt-8 text-sm font-semibold text-lean">0{i + 1}</span>
              <h3 className="mt-2 text-lg font-bold text-ink">{step.title}</h3>
              <p className="mt-2 max-w-xs leading-relaxed text-ink-2">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-center text-xs text-ink-3">
          Screens from the beta build, showing sample data.
        </p>
      </div>
    </section>
  );
}

export function RegionSpotlight() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
      <Phone
        {...screens.fat}
        alt="Fat view with the belly selected, showing its lean, fat and fat percentage"
        sizes="300px"
        className="mx-auto w-[260px] sm:w-[290px]"
      />
      <div>
        <SectionHeading
          eyebrow="Tap any region"
          title="Belly, arms, legs: see each one."
          intro="Switch to the Fat view and the body is colored by your scan's own regional numbers. Tap the belly and you get its lean mass, fat mass and fat percentage, plus how much each moved since your last scan."
        />
        <ul className="mt-8 grid max-w-md grid-cols-3 gap-3 text-center">
          {[
            ["Body", "Your shape"],
            ["Fat", "Fat by region"],
            ["Change", "Scan vs scan"],
          ].map(([k, v]) => (
            <li key={k} className="rounded-2xl border border-outline bg-surface px-3 py-4">
              <p className="font-semibold text-ink">{k}</p>
              <p className="mt-1 text-xs text-ink-3">{v}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const FEATURES: { title: string; body: string; tone: "lean" | "fat" }[] = [
  {
    title: "Fat where you actually carry it",
    body: "Regional fat from your scan shows on the body. High belly fat shows on the belly, not averaged into one number.",
    tone: "fat",
  },
  {
    title: "Lean mass, region by region",
    body: "See lean mass for each arm, each leg and your trunk, and exactly where you added it since your last scan.",
    tone: "lean",
  },
  {
    title: "Levels from real progress",
    body: "Every scan is a level and milestones come from your real changes. No made-up scores: every stat is a DEXA number.",
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
  {
    title: "Light and dark",
    body: "The app follows your phone's light or dark setting, like every screen on this page.",
    tone: "lean",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-y border-outline bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading
          eyebrow="Built for lifters"
          title="Bulk, cut or recomp, on your phone."
          intro="The scale can't tell muscle from fat. Your DEXA can, and the app shows you where."
        />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="rounded-2xl border border-outline bg-bg p-6">
              <span
                aria-hidden
                className={`block h-1.5 w-10 rounded-full ${f.tone === "lean" ? "bg-lean" : "bg-fat"}`}
              />
              <h3 className="mt-4 text-lg font-bold text-ink">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-2">{f.body}</p>
            </li>
          ))}
        </ul>
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
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <SectionHeading
          eyebrow="Privacy"
          title="Your body data stays yours."
          intro="Before the app imports a single scan, it tells you exactly what it stores and asks for your consent."
        />
        <ul className="mt-8 space-y-4">
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
      <Phone
        {...screens.consent}
        alt="Consent screen: what the app stores, before any scan is imported"
        sizes="280px"
        className="mx-auto w-[250px] sm:w-[270px]"
      />
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
