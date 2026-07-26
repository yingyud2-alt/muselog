"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

export type CalendarViewMode = "month" | "timeline";

type MonthHeaderProps = {
  monthLabel: string;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
};

export function MonthHeader({
  monthLabel,
  viewMode,
  onViewModeChange,
}: MonthHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0D1117]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 md:px-8">
        <Link
          href="/"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:border-white/20 hover:text-white/90"
          aria-label="Back to home"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="min-w-0 flex-1 text-center">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
            Journal
          </p>
          <h1 className="truncate text-base font-medium tracking-tight text-white/92 md:text-lg">
            {monthLabel}
          </h1>
        </div>

        <div
          className="flex shrink-0 rounded-full border border-white/10 bg-white/[0.04] p-0.5"
          role="tablist"
          aria-label="Journal view"
        >
          {(["month", "timeline"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={viewMode === mode}
              onClick={() => onViewModeChange(mode)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] transition-colors",
                viewMode === mode
                  ? "bg-white/12 text-white"
                  : "text-white/45 hover:text-white/70",
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
