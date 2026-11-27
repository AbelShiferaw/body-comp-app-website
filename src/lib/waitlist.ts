import "server-only";

import { WAITLIST_CONSENT_VERSION } from "./site";
import type { WaitlistEntry } from "./waitlist-form";

export type SaveResult = "saved" | "not_configured" | "failed";

/**
 * Adds the entry through the `join_waitlist` Postgres function (see
 * body-comp-app `supabase/migrations/*_waitlist.sql`), called with the
 * publishable key. The table itself is closed to anon; the function ignores
 * duplicate emails, so the response never reveals whether someone signed up.
 */
export async function saveWaitlistEntry(entry: WaitlistEntry): Promise<SaveResult> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return "not_configured";

  try {
    const res = await fetch(`${url}/rest/v1/rpc/join_waitlist`, {
      method: "POST",
      headers: {
        apikey: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_email: entry.email,
        p_platform: entry.platform,
        p_dexa: entry.dexa,
        p_consent_version: WAITLIST_CONSENT_VERSION,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      // Status only: never log the email.
      console.error(`[waitlist] join_waitlist failed with HTTP ${res.status}`);
      return "failed";
    }
    return "saved";
  } catch (error) {
    console.error(
      "[waitlist] join_waitlist threw",
      error instanceof Error ? error.name : "unknown",
    );
    return "failed";
  }
}
