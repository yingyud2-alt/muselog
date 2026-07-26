"use client";

import MoodBubbles from "@/components/dashboard/mood-bubbles";
import { TodayMuseButton } from "@/components/habit/TodayMuseButton";
import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";

export function MobileHome() {
  return (
    <div className="flex min-h-[100svh] flex-col">
      <section
        className="relative flex flex-1 items-center justify-center"
        aria-label="Mood bubbles"
      >
        <div className="w-full">
          <MoodBubbles />
        </div>
      </section>

      <TodayMuseButton />

      <p
        className="shrink-0 px-6 pt-4 text-center text-[15px] italic leading-snug text-white/48"
        style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
      >
        Begin with a feeling.
      </p>
    </div>
  );
}
