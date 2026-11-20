# body-comp-app-website

Marketing site for the Obsessed app. Next.js 16 App Router, Tailwind 4, Vercel. See README.md for setup and deploy.

@AGENTS.md

## Rules

1. **Tokens only.** Colors come from the CSS variables in `src/app/globals.css` (Tailwind names `bg`, `surface`, `ink`, `lean`, `fat`, `holo-*`). They mirror the app's `AppTokens`; change values there, never at call sites. Every page must work in light and dark (`prefers-color-scheme`).
2. **Config from env.** URLs, emails and entity names come from `src/lib/site.ts` (env vars). No secrets in this repo or in Vercel: the waitlist uses the Supabase publishable key and the `join_waitlist` function.
3. **Database changes go in the app repo** (`body-comp-app/supabase/migrations`, with a pgTAP test), because both repos share one Supabase project.
4. **Honest copy.** Every number shown is labeled sample data or is real. No medical claims; no claims of partnership with BodySpec or other providers.
5. **Never log emails** or other personal data; log status codes and counts.
6. Legal pages stay marked as drafts until Abel confirms legal review.

## Before a PR

`npm run format:check && npm run lint && npm run typecheck && npm test && npm run build`, plus light and dark screenshots (desktop and phone width) for visual changes.
