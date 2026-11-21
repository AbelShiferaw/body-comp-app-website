"use client";

import Link from "next/link";
import { useActionState } from "react";

import { joinWaitlist, type WaitlistState } from "@/app/actions";

const initialState: WaitlistState = { status: "idle" };

const fieldClass =
  "w-full rounded-xl border border-outline bg-bg px-4 py-3 text-ink placeholder:text-ink-3 focus:border-lean focus:outline-none focus:ring-2 focus:ring-lean/30";

export function WaitlistForm() {
  const [state, action, pending] = useActionState(joinWaitlist, initialState);

  if (state.status === "success") {
    return (
      <div role="status" className="rounded-2xl border border-lean/40 bg-surface p-8 text-center">
        <p className="font-display text-2xl font-extrabold text-ink">You’re on the list.</p>
        <p className="mt-2 text-ink-2">
          We’ll email you when a beta spot opens up. Thanks for being early.
        </p>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="relative space-y-5 rounded-2xl border border-outline bg-surface p-6 sm:p-8"
    >
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-ink">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className={fieldClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="platform" className="mb-2 block text-sm font-semibold text-ink">
            Your phone
          </label>
          <select id="platform" name="platform" defaultValue="" className={fieldClass}>
            <option value="">Choose one</option>
            <option value="ios">iPhone</option>
            <option value="android">Android</option>
          </select>
        </div>
        <div>
          <label htmlFor="dexa" className="mb-2 block text-sm font-semibold text-ink">
            Had a DEXA scan?
          </label>
          <select id="dexa" name="dexa" defaultValue="" className={fieldClass}>
            <option value="">Choose one</option>
            <option value="bodyspec">Yes, at BodySpec</option>
            <option value="other">Yes, somewhere else</option>
            <option value="none">Not yet</option>
          </select>
        </div>
      </div>

      {/* Honeypot for bots; hidden from people and screen readers. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="flex items-start gap-3 text-sm text-ink-2">
        <input
          name="consent"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--lean)]"
        />
        <span>
          Email me about the beta and launch. I can unsubscribe any time. See the{" "}
          <Link href="/privacy" className="text-lean underline">
            privacy policy
          </Link>
          .
        </span>
      </label>

      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-fat">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-lean px-6 py-3 text-base font-semibold text-on-lean hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Joining…" : "Join the waitlist"}
      </button>
    </form>
  );
}
