import type { ReactNode } from "react";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/** Shared shell for the legal pages, with a visible draft banner. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
        <div
          role="note"
          className="rounded-xl border border-fat/40 bg-fat/10 px-4 py-3 text-sm font-medium text-ink"
        >
          Draft for legal review. This document is not final and may change before launch.
        </div>
        <h1 className="font-display mt-8 text-4xl font-extrabold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-2 text-sm text-ink-3">Last updated {updated}</p>
        <article className="legal mt-8">{children}</article>
      </main>
      <SiteFooter />
    </>
  );
}
