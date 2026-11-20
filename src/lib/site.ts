/**
 * Site-wide settings. Environment-specific values come from env vars
 * (see .env.example); nothing environment-specific is hardcoded elsewhere.
 */
export const site = {
  name: "Obsessed",
  tagline: "3D body composition tracking",
  description:
    "Obsessed turns your DEXA scans into a 3D body that shows your fat and lean mass, region by region. Scan again and see what changed.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "[CONTACT EMAIL]",
  legalEntity: process.env.NEXT_PUBLIC_LEGAL_ENTITY ?? "[LEGAL ENTITY]",
} as const;

/** Version of the waitlist consent text, stored with each signup. */
export const WAITLIST_CONSENT_VERSION = "2026-11-20";
