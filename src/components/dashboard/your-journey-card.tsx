"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

import {
  DashboardGlassCard,
  DashboardSectionHeader,
} from "@/components/dashboard/dashboard-glass-card";
import { CustomizeMoodPanel } from "@/components/journal/customize-mood-panel";
import { MonthNavigator } from "@/components/journal/month-navigator";
import { useActiveMonth } from "@/lib/calendar/active-month-store";
import {
  deriveAiMoodKeywords,
  useMoodPreferences,
} from "@/lib/preferences/mood-preference-store";
import { cn } from "@/lib/utils";

type JourneyStats = {
  monthLabel: string;
  books: number;
  movies: number;
  listeningHours: number;
  moods: string[];
};

type YourJourneyCardProps = {
  journeyStats: JourneyStats;
  onLogToday?: () => void;
};

export function YourJourneyCard({
  journeyStats,
  onLogToday,
}: YourJourneyCardProps) {
  const { monthLabel, goPrev, goNext } = useActiveMonth();
  const { profile } = useMoodPreferences();
  const [moodOpen, setMoodOpen] = useState(false);

  const moodKeywords = deriveAiMoodKeywords(profile, journeyStats.moods);

  return (
    <section className="space-y-4">
      <DashboardSectionHeader
        title="Your Journey"
        description="A personal reflection on your cultural rhythm"
        action={
          <Link
            href="/journal"
            className="font-display text-sm text-white/45 transition hover:text-white/72"
          >
            See More
          </Link>
        }
      />

      <DashboardGlassCard className="px-6 py-6 md:px-8 md:py-7">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MonthNavigator
              monthLabel={monthLabel}
              onPrev={goPrev}
              onNext={goNext}
              size="sm"
            />
            {onLogToday ? (
              <button
                type="button"
                onClick={onLogToday}
                className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/18 bg-teal-400/[0.08] px-3.5 py-2 font-display text-xs font-bold text-teal-50/85 transition-colors hover:bg-teal-400/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/25"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Log Today
              </button>
            ) : null}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={monthLabel}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
            >
              <div className="min-w-0">
                <p className="font-label text-[10px] uppercase tracking-[0.18em] text-white/35">
                  Current Mood
                </p>
                <button
                  type="button"
                  onClick={() => setMoodOpen(true)}
                  className={cn(
                    "mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1.5 text-left",
                    "rounded-xl transition-opacity hover:opacity-90",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/20",
                  )}
                  aria-label="Customize your mood"
                >
                  {moodKeywords.map((mood) => (
                    <span
                      key={mood}
                      className={cn(
                        "font-display text-[26px] font-bold tracking-tight md:text-[28px]",
                        "bg-gradient-to-r from-teal-200 via-sky-200 to-teal-100/90",
                        "bg-clip-text text-transparent",
                        "[filter:drop-shadow(0_0_14px_rgba(122,217,189,0.28))]",
                      )}
                    >
                      {mood}
                    </span>
                  ))}
                </button>
                <p className="font-display mt-2 text-[11px] text-white/32">
                  Tap to refine your emotional lens
                </p>
              </div>

              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm text-white/55 md:justify-end md:gap-x-8">
                <p className="font-display">
                  <span className="font-label mr-1.5 text-lg font-bold tabular-nums text-white/82">
                    {journeyStats.books}
                  </span>
                  Books
                </p>
                <p className="font-display">
                  <span className="font-label mr-1.5 text-lg font-bold tabular-nums text-white/82">
                    {journeyStats.movies}
                  </span>
                  Movies
                </p>
                <p className="font-display">
                  <span className="font-label mr-1.5 text-lg font-bold tabular-nums text-white/82">
                    {journeyStats.listeningHours}
                  </span>
                  Hours Listening
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </DashboardGlassCard>

      <CustomizeMoodPanel open={moodOpen} onClose={() => setMoodOpen(false)} />
    </section>
  );
}
