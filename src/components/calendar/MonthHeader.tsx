"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { MonthNavigator } from "@/components/journal/month-navigator";
import { cn } from "@/lib/utils";

export type CalendarViewMode = "month" | "timeline";

type MonthHeaderProps = {
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
};

export function MonthHeader({
  monthLabel,
  onPrevMonth,
  onNextMonth,
  viewMode,
  onViewModeChange,
}: MonthHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.05] bg-[#0D1117]/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 md:px-8">
        <Link
          href="/"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white/85"
          aria-label="Back to home"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col items-center">
          <p className="font-label text-[10px] uppercase tracking-[0.18em] text-white/32">
            Journal
          </p>
          <MonthNavigator
            monthLabel={monthLabel}
            onPrev={onPrevMonth}
            onNext={onNextMonth}
            className="mt-1"
          />
        </div>

        <div
          className="flex shrink-0 rounded-full bg-white/[0.04] p-0.5"
          role="tablist"
          aria-label="Journal view"
        >
          {(
            [
              { id: "month", label: "Month" },
              { id: "timeline", label: "Archive" },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={viewMode === mode.id}
              onClick={() => onViewModeChange(mode.id)}
              className={cn(
                "rounded-full px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.12em] transition-colors",
                viewMode === mode.id
                  ? "bg-white/12 text-white"
                  : "text-white/40 hover:text-white/65",
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
