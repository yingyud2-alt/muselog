import { cn } from "@/lib/utils";

type EmptyDayDecorationProps = {
  day: number;
  isCurrentMonth: boolean;
  variant?: "desktop" | "mobile";
};

/** Adjacent-month filler — quiet day number only. */
export function EmptyDayDecoration({
  day,
  isCurrentMonth,
  variant = "desktop",
}: EmptyDayDecorationProps) {
  const isMobile = variant === "mobile";

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-[#0C1016]/80 px-1.5 pt-1.5",
        isMobile ? "min-h-[118px]" : "min-h-[148px] md:min-h-[158px]",
      )}
      aria-hidden="true"
    >
      <p
        className={cn(
          "tabular-nums leading-none",
          isMobile ? "text-[11px]" : "text-[12px]",
          isCurrentMonth ? "text-white/28" : "text-white/12",
        )}
      >
        {day}
      </p>
    </div>
  );
}
