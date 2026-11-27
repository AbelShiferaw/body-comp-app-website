import Link from "next/link";

import { site } from "@/lib/site";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`font-display text-lg font-extrabold tracking-[0.18em] text-ink ${className}`}
      aria-label={`${site.name} home`}
    >
      {site.name.toUpperCase()}
    </Link>
  );
}
