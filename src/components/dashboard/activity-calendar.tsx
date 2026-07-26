import { cn } from "@/lib/utils";

import {
  type ActivityLevel,
  type ActivityWeek,
  activityWeeks,
} from "./mock-data";

const LEVEL_STYLES: Record<ActivityLevel, string> = {
  0: "bg-white/[0.06]",
  1: "bg-white/15",
  2: "bg-white/25",
  3: "bg-white/40",
  4: "bg-white/55",
};

const LEGEND_LEVELS: ActivityLevel[] = [0, 1, 2, 3, 4];

function formatTooltipDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatActivityTooltip(day: ActivityWeek["days"][number]): string {
  const formattedDate = formatTooltipDate(day.date);

  if (day.count === 0) {
    return `${formattedDate}: No activity`;
  }

  if (day.count === 1) {
    return `${formattedDate}: 1 activity`;
  }

  return `${formattedDate}: ${day.count} activities`;
}

type ActivityCalendarProps = {
  weeks?: ActivityWeek[];
};

export function ActivityCalendar({
  weeks = activityWeeks,
}: ActivityCalendarProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-medium tracking-tight text-white/88">
          Activity
        </h2>
        <p className="text-sm text-white/42">
          Your reading, watching, and listening journey
        </p>
      </div>

      <div
        className={cn(
          "rounded-2xl border border-white/[0.08] bg-white/[0.03]",
          "p-5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-md",
        )}
      >
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <div
            className="inline-flex min-w-max gap-1"
            role="img"
            aria-label="Activity calendar for the last 16 weeks"
          >
            {weeks.map((week) => (
              <div
                key={week.weekStart}
                className="flex shrink-0 flex-col gap-1"
              >
                {week.days.map((day) => (
                  <div
                    key={day.date}
                    title={formatActivityTooltip(day)}
                    className={cn(
                      "size-3 shrink-0 rounded-sm sm:size-3.5",
                      "ring-1 ring-white/10 transition-colors",
                      LEVEL_STYLES[day.level],
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-white/40">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {LEGEND_LEVELS.map((level) => (
              <div
                key={level}
                className={cn(
                  "size-3 rounded-sm ring-1 ring-white/10 sm:size-3.5",
                  LEVEL_STYLES[level],
                )}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </section>
  );
}
