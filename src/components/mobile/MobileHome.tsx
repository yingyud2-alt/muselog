"use client";

import MoodBubbles from "@/components/dashboard/mood-bubbles";
import { TodayMuseButton } from "@/components/habit/TodayMuseButton";
import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";

export function MobileHome() {
  return (
    <div className="flex min-h-[100svh] flex-col">
      <section
        className="relative flex flex-1 flex-col justify-center"
        aria-label="Mood bubbles"
      >
        <div className="w-full">
          <MoodBubbles />
        </div>

        <div className="shrink-0 space-y-2 px-6 pb-2 pt-2 text-center">
          <p className="font-display text-[12px] leading-relaxed text-white/30">
            A quiet archive of what moves you.
          </p>
          <p className="font-display text-[15px] leading-snug text-white/48">
            Begin with a feeling.
          </p>
        </div>
      </section>

      <div className="shrink-0" style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}>
        <TodayMuseButton />
      </div>
    </div>
  );
}
