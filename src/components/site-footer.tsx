import { cacheLife } from "next/cache";
import Link from "next/link";

import { site } from "@/lib/site";
import { Wordmark } from "./wordmark";

async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-outline bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1fr_auto] sm:px-6">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-md text-sm text-ink-3">
            {site.name} is not a medical device and does not give medical advice. BodySpec is a
            trademark of its owner; {site.name} is not affiliated with or endorsed by BodySpec.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2 sm:flex-col">
          <Link href="/privacy" className="hover:text-ink">
            Privacy policy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms of use
          </Link>
          <a href={`mailto:${site.contactEmail}`} className="hover:text-ink">
            Contact
          </a>
        </nav>
      </div>
      <div className="border-t border-outline">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-ink-3 sm:px-6">
          © <CurrentYear /> {site.legalEntity}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
