import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  type ActivityLevel,
  type ActivityWeek,
  activityWeeks,
} from "./mock-data";
import { SectionHeader } from "./section-header";

const LEVEL_STYLES: Record<ActivityLevel, string> = {
  0: "bg-muted",
  1: "bg-foreground/15",
  2: "bg-foreground/25",
  3: "bg-foreground/40",
  4: "bg-foreground/55",
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
      <SectionHeader
        title="Activity"
        description="Your reading, watching, and listening journey"
      />

      <Card className="shadow-sm ring-foreground/8">
        <CardContent className="space-y-4 pt-0">
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
                        "ring-1 ring-foreground/5 transition-colors",
                        LEVEL_STYLES[day.level],
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex items-center gap-1">
              {LEGEND_LEVELS.map((level) => (
                <div
                  key={level}
                  className={cn(
                    "size-3 rounded-sm ring-1 ring-foreground/5 sm:size-3.5",
                    LEVEL_STYLES[level],
                  )}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
