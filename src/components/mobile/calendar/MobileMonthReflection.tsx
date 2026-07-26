"use client";

import { computeMonthHabitStats } from "@/lib/habit/habit-utils";
import { useHabitLogs } from "@/lib/habit/habit-store";
import { cn } from "@/lib/utils";

type MobileMonthReflectionProps = {
  year: number;
  month: number;
  monthLabel: string;
  className?: string;
};

function HabitBar({
  label,
  ratio,
}: {
  label: string;
  ratio: number;
}) {
  const filled = Math.round(ratio * 9);
  const empty = 9 - filled;

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-white/45">{label}</p>
      <p
        className="font-label text-sm tracking-[0.2em] text-teal-300/75"
        aria-label={`${label} activity ${Math.round(ratio * 100)} percent`}
      >
        {"█".repeat(filled)}
        {"░".repeat(empty)}
      </p>
    </div>
  );
}

export function MobileMonthReflection({
  year,
  month,
  monthLabel,
  className,
}: MobileMonthReflectionProps) {
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
        {monthLabel.split(" ")[0]} reflection
      </p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/55">
        <span>{stats.readCount} Books</span>
        <span>{stats.watchCount} Movies</span>
        <span>{stats.listenCount} Albums</span>
      </div>

      {stats.streak > 0 && (
        <p className="mt-3 text-sm text-white/50">
          <span aria-hidden="true">🔥 </span>
          {stats.streak} day Muse streak
        </p>
      )}

      <div className="mt-6 space-y-4">
        <HabitBar label="Reading" ratio={stats.readingRatio} />
        <HabitBar label="Watching" ratio={stats.watchingRatio} />
        <HabitBar label="Listening" ratio={stats.listeningRatio} />
      </div>
    </section>
  );
}
