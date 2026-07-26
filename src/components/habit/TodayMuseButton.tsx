"use client";

import { useState } from "react";

import { HabitQuickLog } from "@/components/habit/HabitQuickLog";
import { formatDurationLabel } from "@/components/habit/CustomDurationInput";
import {
  getDisplayTodayString,
  hasMusedToday,
} from "@/lib/habit/habit-utils";
import { getHabitLogForDate } from "@/lib/habit/habit-mock";
import { useHabitLogs } from "@/lib/habit/habit-store";
import { cn } from "@/lib/utils";

function getLoggedSummary(
  read: boolean,
  watch: boolean,
  listen: boolean,
  duration: number,
): string {
  const parts: string[] = [];

  if (read) parts.push("📖");
  if (watch) parts.push("🎬");
  if (listen) parts.push("🎵");

  const activity = parts.join(" ") || "🌱";
  return `${activity} · ${formatDurationLabel(duration)}`;
}

export function TodayMuseButton() {
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const { logs } = useHabitLogs();
  const today = getDisplayTodayString();
  const mused = hasMusedToday(logs, today);
  const todayLog = getHabitLogForDate(logs, today);

  return (
    <>
      <button
        type="button"
        onClick={() => setQuickLogOpen(true)}
        className={cn(
          "mx-5 shrink-0 rounded-[20px] border border-white/[0.06] bg-white/[0.02] px-4 py-3.5",
          "shadow-[0_2px_16px_rgba(0,0,0,0.1)] backdrop-blur-xl",
          "transition-colors hover:border-white/10 hover:bg-white/[0.035]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/12",
        )}
      >
        {mused && todayLog ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5 text-left">
              <p className="text-sm text-white/58">
                <span aria-hidden="true">🌱 </span>
                Muse logged
              </p>
              <p className="truncate text-xs text-white/40">
                {getLoggedSummary(
                  todayLog.read,
                  todayLog.watch,
                  todayLog.listen,
                  todayLog.duration,
                )}
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.14em] text-teal-300/55">
              Edit
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <span className="text-lg" aria-hidden="true">
                🌱
              </span>
              <p className="text-sm text-white/58">Did you Muse today?</p>
            </div>
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
              Log
            </span>
          </div>
        )}
      </button>

      <HabitQuickLog
        open={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
      />
    </>
  );
}
