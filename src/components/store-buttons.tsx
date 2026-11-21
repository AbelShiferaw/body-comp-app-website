import Link from "next/link";

function Badge({ store, platform }: { store: string; platform: string }) {
  return (
    <Link
      href="/#waitlist"
      className="flex items-center gap-3 rounded-xl bg-ink px-4 py-2.5 text-bg hover:opacity-90"
      aria-label={`${store}: coming soon. Join the waitlist`}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-7 w-7 fill-none stroke-current"
        strokeWidth="1.6"
      >
        <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
        <path d="M10.5 18.5h3" strokeLinecap="round" />
      </svg>
      <span className="leading-tight">
        <span className="block text-[10px] uppercase tracking-wider opacity-80">
          Coming soon · {platform}
        </span>
        <span className="block text-base font-semibold">{store}</span>
      </span>
    </Link>
  );
}

/** Store "coming soon" buttons; both lead to the waitlist until the apps are listed. */
export function StoreButtons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <Badge store="App Store" platform="iPhone" />
      <Badge store="Google Play" platform="Android" />
    </div>
  );
}
