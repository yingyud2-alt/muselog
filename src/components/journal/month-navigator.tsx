"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type MonthNavigatorProps = {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
  size?: "sm" | "md";
};

export function MonthNavigator({
  monthLabel,
  onPrev,
  onNext,
  className,
  size = "md",
}: MonthNavigatorProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Previous month"
        onClick={onPrev}
        className={cn(
          "flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/55 transition-colors hover:border-white/18 hover:text-white/85",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/20",
          size === "sm" ? "size-7" : "size-8",
        )}
      >
        <ChevronLeft className={size === "sm" ? "size-3.5" : "size-4"} />
      </button>

      <p
        className={cn(
          "font-display min-w-[7.5rem] text-center font-bold tracking-tight text-white/88 transition-opacity",
          size === "sm" ? "text-sm" : "text-base",
        )}
      >
        {monthLabel}
      </p>

      <button
        type="button"
        aria-label="Next month"
        onClick={onNext}
        className={cn(
          "flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/55 transition-colors hover:border-white/18 hover:text-white/85",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/20",
          size === "sm" ? "size-7" : "size-8",
        )}
      >
        <ChevronRight className={size === "sm" ? "size-3.5" : "size-4"} />
      </button>
    </div>
  );
}
