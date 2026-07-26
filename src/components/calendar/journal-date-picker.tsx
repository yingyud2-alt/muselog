"use client";

import { JourneyHighlightBar } from "@/components/calendar/JourneyHighlightBar";
import {
  formatJourneyDay,
  isValidDateString,
} from "@/lib/calendar/journey-utils";
import type { JourneyColor } from "@/types/media";
import { cn } from "@/lib/utils";

type JournalDatePickerProps = {
  startDate: string;
  endDate: string;
  journeyColor: JourneyColor;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  className?: string;
};

export function JournalDatePicker({
  startDate,
  endDate,
  journeyColor,
  onStartChange,
  onEndChange,
  className,
}: JournalDatePickerProps) {
  const previewEnd =
    endDate && isValidDateString(endDate) ? endDate : startDate;
  const showRange = previewEnd !== startDate;

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">
          Timeline
        </p>
        <JourneyHighlightBar color={journeyColor} className="mt-2 h-[3px]" />
        <div className="mt-2 flex items-center gap-2 text-sm text-white/62">
          <span>{formatJourneyDay(startDate)}</span>
          {showRange && (
            <>
              <span className="text-white/25">—</span>
              <span>{formatJourneyDay(previewEnd)}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">
            Started
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartChange(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80 outline-none focus-visible:ring-2 focus-visible:ring-white/15"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">
            Finished
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => onEndChange(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80 outline-none focus-visible:ring-2 focus-visible:ring-white/15"
          />
        </label>
      </div>
    </div>
  );
}
