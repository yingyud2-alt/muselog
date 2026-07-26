"use client";

import { computeMonthHabitStats } from "@/lib/habit/habit-utils";
import { useHabitLogs } from "@/lib/habit/habit-store";
import { cn } from "@/lib/utils";

type MediaHabitTrackerProps = {
  year: number;
  month: number;
  className?: string;
};

const HABIT_TYPES = [
  { emoji: "📖", label: "Read" },
  { emoji: "🎬", label: "Watch" },
  { emoji: "🎵", label: "Listen" },
] as const;

export function MediaHabitTracker({
  year,
  month,
  className,
}: MediaHabitTrackerProps) {
  const { logs } = useHabitLogs();
  const stats = computeMonthHabitStats(logs, year, month);

  return (
    <section
      className={cn(
        "rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-5",
        className,
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
        Media habit tracker
      </p>
      <p className="mt-2 text-sm text-white/48">
        Your rhythm of reading, watching, and listening this month.
      </p>

      <div className="mt-5 flex justify-around gap-2">
        {HABIT_TYPES.map((type) => (
          <div
            key={type.label}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <span className="text-xl" aria-hidden="true">
              {type.emoji}
            </span>
            <span className="text-[11px] text-white/45">{type.label}</span>
          </div>
        ))}
      </div>

      <p className="mt-5 text-center text-xs text-white/38">
        {stats.readCount + stats.watchCount + stats.listenCount} muse moments
        recorded
      </p>
    </section>
  );
}
