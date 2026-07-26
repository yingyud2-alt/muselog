import { ActivityCalendar } from "@/components/dashboard/activity-calendar";
import { HeroSection } from "@/components/dashboard/hero-section";
import MoodBubbles from "@/components/dashboard/mood-bubbles";
import QuickLogBar from "@/components/dashboard/quick-log-bar";
import { MobileHome } from "@/components/mobile/MobileHome";

import {
  readingStats,
} from "@/components/dashboard/mock-data";

import { StatsGrid } from "@/components/dashboard/stats-grid";


export default function Home() {
  return (
    <main
      className="
      min-h-[100svh]
      overflow-x-hidden
      bg-[#0D1117]
      text-white
      md:min-h-screen
      "
    >

      <div
        className="
        mx-auto
        max-w-6xl
        px-0
        md:px-6
        "
      >

        <div className="md:hidden">
          <MobileHome />
        </div>

        <div className="hidden md:contents">

          {/* Desktop greeting */}
          <div className="hidden md:block">
            <HeroSection />
          </div>

          {/* Mood universe */}
          <section className="relative shrink-0 md:-mt-10">
            <MoodBubbles />
          </section>

          <QuickLogBar />

        </div>



        {/* Reading Stats — desktop only */}

        <section
          className="
          mt-20
          hidden
          space-y-4
          md:block
          "
        >

          <h2
            className="
            text-xl
            font-medium
            "
          >
            Reading Stats
          </h2>


          <p
            className="
            text-sm
            text-white/40
            "
          >
            A snapshot of your media journal
          </p>


          <StatsGrid
            items={readingStats}
          />


        </section>




        {/* Calendar — desktop only */}

        <section
          className="
          mt-20
          hidden
          px-6
          pb-[calc(env(safe-area-inset-bottom)+24px)]
          md:mt-20
          md:block
          md:px-0
          md:pb-0
          "
        >

          <ActivityCalendar />

        </section>



      </div>

    </main>
  );
}
