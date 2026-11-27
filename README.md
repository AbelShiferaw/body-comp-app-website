# Obsessed website

Marketing site for **Obsessed** (working name), the app that turns DEXA scans into a 3D avatar with real muscle and fat. Next.js 16 (App Router) + Tailwind CSS 4, hosted on Vercel. The app itself lives in [`AbelShiferaw/body-comp-app`](https://github.com/AbelShiferaw/body-comp-app).

## Pages

- `/`: promotes the mobile app with real app screenshots in phone frames (`public/screens/`, from the beta build): hero with two phones and App Store / Google Play "coming soon" buttons, how it works (connect, home, change), tap-a-region spotlight, features, privacy (consent screen), FAQ, beta waitlist.

To refresh screenshots, replace the PNGs in `public/screens/` (390×844 or larger, same names). iPhone simulator captures at 3x look sharpest.

- `/privacy`, `/terms`: **drafts for legal review**, shown with a draft banner and `noindex` until a lawyer signs off.

Light and dark mode follow the visitor's system setting, using the app's Direction A tokens (`src/app/globals.css`).

## Run it

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3000
```

Checks (CI runs all of them):

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

## Waitlist

The form posts to a Server Action (`src/app/actions.ts`) that validates input (`src/lib/waitlist-form.ts`) and calls the Supabase function `join_waitlist` with the **publishable** key (`src/lib/waitlist.ts`). The `waitlist` table is closed to anon and signed-in users (RLS on, no policies, no grants); the function ignores duplicate emails so the form never reveals who has signed up. No secret keys live in this repo or in Vercel.

The table and function are defined in the app repo's Supabase migrations (`supabase/migrations/20261120090000_waitlist.sql`), since both share one Supabase project. Read signups in the Supabase dashboard (Table editor → `waitlist`) or export as CSV.

Without `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`, the form shows "The waitlist isn't open yet".

## Deploy on Vercel

1. In Vercel, **Add New → Project**, import `AbelShiferaw/body-comp-app-website`. Framework preset: Next.js (defaults are fine).
2. Set environment variables (Production and Preview):
   - `NEXT_PUBLIC_SITE_URL`: the production URL, e.g. `https://obsessed.app`
   - `NEXT_PUBLIC_CONTACT_EMAIL`: public contact address
   - `NEXT_PUBLIC_LEGAL_ENTITY`: company name for the footer and legal pages
   - `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`: from Supabase → Project settings → API keys
3. Apply the waitlist migration to the Supabase project (`supabase db push` from the app repo).
4. Add the domain under Project → Settings → Domains.

Vercel's Hobby plan is for non-commercial use only; move to **Pro** before launch.

## Before launch

- Lawyer review of `/privacy` and `/terms`; fill `[STATE]` and dispute terms; remove the draft banner and `noindex`.
- Sharper 3x simulator screenshots; official App Store / Google Play badges once the apps are listed.
- Bot protection on the waitlist beyond the honeypot (e.g. Vercel BotID or Cloudflare Turnstile) if spam shows up.
- Final name, logo and domain.
