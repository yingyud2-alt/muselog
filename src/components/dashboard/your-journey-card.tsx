"use client";

import {
  DashboardGlassCard,
  DashboardSectionHeader,
} from "@/components/dashboard/dashboard-glass-card";

type JourneyStats = {
  monthLabel: string;
  books: number;
  movies: number;
  listeningHours: number;
  moods: string[];
};

type YourJourneyCardProps = {
  journeyStats: JourneyStats;
};

export function YourJourneyCard({ journeyStats }: YourJourneyCardProps) {
  return (
    <section className="space-y-4">
      <DashboardSectionHeader
        title="Your Journey"
        description="A personal reflection on your cultural rhythm"
      />

      <DashboardGlassCard className="px-6 py-7 md:px-8 md:py-8">
        <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-base font-medium text-white/88">
              Your {journeyStats.monthLabel} Journey
            </p>
            <p className="text-sm leading-relaxed text-white/48">
              Current mood:{" "}
              <span className="text-white/68">
                {journeyStats.moods.join(" · ")}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm text-white/55 md:justify-end md:gap-x-8">
            <p>
              <span className="mr-1.5 text-lg font-medium tabular-nums text-white/82">
                {journeyStats.books}
              </span>
              Books
            </p>
            <p>
              <span className="mr-1.5 text-lg font-medium tabular-nums text-white/82">
                {journeyStats.movies}
              </span>
              Movies
            </p>
            <p>
              <span className="mr-1.5 text-lg font-medium tabular-nums text-white/82">
                {journeyStats.listeningHours}
              </span>
              Hours Listening
            </p>
          </div>
        </div>
      </DashboardGlassCard>
    </section>
  );
}
