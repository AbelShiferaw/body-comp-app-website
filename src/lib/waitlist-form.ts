export const PLATFORMS = ["ios", "android"] as const;
export const DEXA_OPTIONS = ["bodyspec", "other", "none"] as const;

export type Platform = (typeof PLATFORMS)[number];
export type DexaOption = (typeof DEXA_OPTIONS)[number];

export type WaitlistEntry = {
  email: string;
  platform: Platform | null;
  dexa: DexaOption | null;
};

export type ParseResult =
  | { ok: true; entry: WaitlistEntry }
  | { ok: false; error: "invalid_email" | "missing_consent" | "spam" };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

/** Validates the signup form. Pure, so it is unit tested. */
export function parseWaitlistForm(form: FormData): ParseResult {
  // Honeypot: real people never see or fill this field.
  if (String(form.get("company") ?? "") !== "") return { ok: false, error: "spam" };

  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return { ok: false, error: "invalid_email" };
  }
  if (form.get("consent") !== "on") return { ok: false, error: "missing_consent" };

  return {
    ok: true,
    entry: {
      email,
      platform: pick(form.get("platform"), PLATFORMS),
      dexa: pick(form.get("dexa"), DEXA_OPTIONS),
    },
  };
}
