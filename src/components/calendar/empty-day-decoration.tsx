import { cn } from "@/lib/utils";

type EmptyDayDecorationProps = {
  day: number;
  isCurrentMonth: boolean;
};

export function EmptyDayDecoration({
  day,
  isCurrentMonth,
}: EmptyDayDecorationProps) {
  return (
    <div className="flex h-full min-h-[88px] flex-col rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-2.5">
      <p
        className={cn(
          "text-xs tabular-nums",
          isCurrentMonth ? "text-white/38" : "text-white/15",
        )}
      >
        {day}
      </p>
    </div>
  );
}
