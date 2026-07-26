"use client";

import {
  computeMonthSummary,
  formatMonthYear,
  getMonthReflection,
} from "@/lib/calendar/utils";
import {
  computeMonthHabitStats,
  formatHabitMinutes,
} from "@/lib/habit/habit-utils";
import { useHabitLogs } from "@/lib/habit/habit-store";
import type { MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";

type MonthSummaryProps = {
  year: number;
  month: number;
  memories: MediaItem[];
  className?: string;
};

export function MonthSummary({
  year,
  month,
  memories,
  className,
}: MonthSummaryProps) {
  const { logs } = useHabitLogs();
  const summary = computeMonthSummary(memories);
  const habitStats = computeMonthHabitStats(logs, year, month);
  const { tagline, mostMemorable } = getMonthReflection(memories);
  const monthLabel = formatMonthYear(year, month);
  const monthName = monthLabel.split(" ")[0];

  if (summary.total === 0 && habitStats.readCount === 0) {
    return null;
  }

  return (
    <footer
      className={cn(
        "rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-5 md:p-6",
        className,
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
        {monthName} reflection
      </p>

      <p className="font-body mt-3 text-base leading-relaxed text-white/52 md:text-lg">
        {tagline}
      </p>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/58">
        {summary.books > 0 && (
          <span>
            {summary.books} {summary.books === 1 ? "Book" : "Books"}
          </span>
        )}
        {summary.movies > 0 && (
          <span>
            {summary.movies} {summary.movies === 1 ? "Movie" : "Movies"}
          </span>
        )}
        {summary.albums > 0 && (
          <span>
            {summary.albums} {summary.albums === 1 ? "Album" : "Albums"}
          </span>
        )}
      </div>

      {habitStats.streak > 0 && (
        <p className="mt-4 text-sm text-white/48">
          <span aria-hidden="true">✦ </span>
          {habitStats.streak} day Muse streak
        </p>
      )}

      <div className="mt-5 space-y-2 border-t border-white/[0.05] pt-5 text-sm text-white/42">
        {habitStats.readingMinutes > 0 && (
          <p>
            Reading time ·{" "}
            <span className="text-white/58">
              {formatHabitMinutes(habitStats.readingMinutes)}
            </span>
          </p>
        )}
        {habitStats.watchingMinutes > 0 && (
          <p>
            Watching time ·{" "}
            <span className="text-white/58">
              {formatHabitMinutes(habitStats.watchingMinutes)}
            </span>
          </p>
        )}
      </div>

      {mostMemorable && (
        <div className="mt-5 border-t border-white/[0.05] pt-5">
          <p className="text-xs text-white/38">The story that stayed</p>
          <p className="mt-1 text-lg font-medium tracking-tight text-white/88 md:text-xl">
            {mostMemorable.title}
          </p>
        </div>
      )}
    </footer>
  );
}
