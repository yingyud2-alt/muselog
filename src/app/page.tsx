import { ActivityCalendar } from "@/components/dashboard/activity-calendar";
import { AiPickCard } from "@/components/dashboard/ai-pick-card";
import { MediaProgressCard } from "@/components/dashboard/continue-reading-card";
import { HeroSection } from "@/components/dashboard/hero-section";
import {
  aiPicks,
  continueExploring,
  recentlyAdded,
  readingStats,
} from "@/components/dashboard/mock-data";
import { RecentlyAddedCard } from "@/components/dashboard/recently-added-card";
import { SectionHeader } from "@/components/dashboard/section-header";
import { StatsGrid } from "@/components/dashboard/stats-grid";

export default function Home() {
  return (
    <div className="flex-1 overflow-x-hidden bg-background">
      <div className="mx-auto max-w-5xl space-y-12 px-6 py-10 sm:px-8 sm:py-12">
        <HeroSection />

        <section className="space-y-4">
          <SectionHeader
            title="Reading Stats"
            description="A snapshot of your media journal"
          />
          <StatsGrid items={readingStats} />
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Continue Exploring"
            description="Pick up your books, films, and albums in progress"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {continueExploring.map((item) => (
              <MediaProgressCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Recently Added"
            description="Fresh entries in your library"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {recentlyAdded.map((item) => (
              <RecentlyAddedCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        <ActivityCalendar />

        <section className="space-y-4">
          <SectionHeader
            title="AI Picks for You"
            description="Personalized suggestions based on your journal"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {aiPicks.map((item) => (
              <AiPickCard key={item.title} item={item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
