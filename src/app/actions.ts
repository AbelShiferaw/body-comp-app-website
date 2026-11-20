"use server";

import { saveWaitlistEntry } from "@/lib/waitlist";
import { parseWaitlistForm } from "@/lib/waitlist-form";

export type WaitlistState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

const MESSAGES = {
  invalid_email: "Enter a valid email address.",
  missing_consent: "Please tick the box so we can email you about the beta.",
  not_configured: "The waitlist isn't open yet. Please try again soon.",
  failed: "Something went wrong on our side. Please try again.",
} as const;

export async function joinWaitlist(_prev: WaitlistState, form: FormData): Promise<WaitlistState> {
  const parsed = parseWaitlistForm(form);
  if (!parsed.ok) {
    // Bots get the same success screen, so they learn nothing.
    if (parsed.error === "spam") return { status: "success" };
    return { status: "error", message: MESSAGES[parsed.error] };
  }

  const result = await saveWaitlistEntry(parsed.entry);
  if (result === "saved") return { status: "success" };
  return { status: "error", message: MESSAGES[result] };
}
