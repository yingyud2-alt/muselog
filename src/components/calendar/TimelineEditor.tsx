"use client";

import { useState } from "react";

import {
  JOURNEY_COLOR_OPTIONS,
  JOURNEY_COLOR_STYLES,
  type JourneyColor,
} from "@/types/media";
import { cn } from "@/lib/utils";

type TimelineEditorProps = {
  startDate: string;
  endDate: string;
  journeyColor: JourneyColor;
  onSave: (
    startDate: string,
    endDate: string,
    journeyColor: JourneyColor,
  ) => void;
  onClose: () => void;
};

export function TimelineEditor({
  startDate,
  endDate,
  journeyColor,
  onSave,
  onClose,
}: TimelineEditorProps) {
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const [draftColor, setDraftColor] = useState(journeyColor);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white/82">Timeline</p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-white/40 hover:text-white/65"
        >
          Close
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">
            Start date
          </span>
          <input
            type="date"
            value={draftStart}
            onChange={(event) => setDraftStart(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80 outline-none"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">
            End date
          </span>
          <input
            type="date"
            value={draftEnd}
            onChange={(event) => setDraftEnd(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80 outline-none"
          />
        </label>
      </div>

      <p className="mt-4 text-[10px] uppercase tracking-[0.12em] text-white/35">
        Choose color
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {JOURNEY_COLOR_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setDraftColor(option)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
              draftColor === option
                ? "border-white/25 bg-white/10 text-white"
                : "border-white/10 text-white/45",
            )}
          >
            <span
              className={cn(
                "size-3 rounded-full",
                JOURNEY_COLOR_STYLES[option].highlight,
              )}
              aria-hidden="true"
            />
            {JOURNEY_COLOR_STYLES[option].label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          onSave(draftStart, draftEnd, draftColor);
          onClose();
        }}
        className="mt-4 w-full rounded-full border border-white/12 bg-white/[0.06] py-2.5 text-sm text-white/78 hover:bg-white/10"
      >
        Save
      </button>
    </div>
  );
}
