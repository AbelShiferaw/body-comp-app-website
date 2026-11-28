import { describe, expect, it } from "vitest";

import { parseWaitlistForm } from "../waitlist-form";

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("parseWaitlistForm", () => {
  it("accepts a valid signup and normalizes the email", () => {
    const result = parseWaitlistForm(
      form({ email: "  Lifter@Example.COM ", platform: "ios", dexa: "bodyspec", consent: "on" }),
    );
    expect(result).toEqual({
      ok: true,
      entry: { email: "lifter@example.com", platform: "ios", dexa: "bodyspec" },
    });
  });

  it("drops unknown or empty select values", () => {
    const result = parseWaitlistForm(
      form({ email: "a@b.co", platform: "windows", dexa: "", consent: "on" }),
    );
    expect(result).toEqual({ ok: true, entry: { email: "a@b.co", platform: null, dexa: null } });
  });

  it.each(["", "not-an-email", "a@b", "a b@c.com", `${"x".repeat(250)}@b.co`])(
    "rejects invalid email %j",
    (email) => {
      expect(parseWaitlistForm(form({ email, consent: "on" }))).toEqual({
        ok: false,
        error: "invalid_email",
      });
    },
  );

  it("requires consent", () => {
    expect(parseWaitlistForm(form({ email: "a@b.co" }))).toEqual({
      ok: false,
      error: "missing_consent",
    });
  });

  it("flags the honeypot as spam", () => {
    expect(parseWaitlistForm(form({ email: "a@b.co", consent: "on", company: "Acme" }))).toEqual({
      ok: false,
      error: "spam",
    });
  });
});
