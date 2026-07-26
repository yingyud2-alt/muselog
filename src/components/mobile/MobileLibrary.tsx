"use client";

import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";

export function MobileLibrary() {
  return (
    <div
      className="flex min-h-[100svh] flex-col items-center justify-center px-8 text-center"
      style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
    >
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
        Library
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white/88">
        Coming soon
      </h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/45">
        Your books, films, and albums will live here — a quiet shelf for
        everything you&apos;ve mused.
      </p>
    </div>
  );
}
