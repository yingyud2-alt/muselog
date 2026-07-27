import { cn } from "@/lib/utils";

type EmptyDayDecorationProps = {
  day: number;
  isCurrentMonth: boolean;
  variant?: "desktop" | "mobile";
};

/** Adjacent-month filler — matches compact journal cell height. */
export function EmptyDayDecoration({
  day,
  isCurrentMonth,
  variant = "desktop",
}: EmptyDayDecorationProps) {
  const isMobile = variant === "mobile";

  return (
    <div
      className={cn(
        "flex flex-col rounded-[10px] border border-white/[0.04] bg-white/[0.015] px-1 pt-1",
        isMobile ? "h-[56px]" : "h-[64px] md:h-[68px] md:rounded-[12px]",
      )}
      aria-hidden="true"
    >
      <p
        className={cn(
          "text-[11px] tabular-nums leading-none",
          isCurrentMonth ? "text-white/38" : "text-white/15",
        )}
      >
        {day}
      </p>
    </div>
  );
}
