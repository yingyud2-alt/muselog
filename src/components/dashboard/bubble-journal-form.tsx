"use client";

import { useState } from "react";

import { defaultJourneyColorForWork } from "@/lib/content/bubble-content-bridge";
import type { JournalFormValues } from "@/lib/content/user-media-state";
import type { WorkBubble } from "@/components/dashboard/mood-bubble-data";
import { getDisplayTodayString } from "@/lib/habit/habit-utils";
import {
  JOURNEY_COLOR_OPTIONS,
  JOURNEY_COLOR_STYLES,
  type JourneyColor,
} from "@/types/media";
import { cn } from "@/lib/utils";

type BubbleJournalFormProps = {
  work: WorkBubble;
  onSave: (values: JournalFormValues) => void;
  onCancel: () => void;
  className?: string;
  /** nested = mobile sheet card; panel = desktop glass modal body */
  presentation?: "nested" | "panel";
};

export function BubbleJournalForm({
  work,
  onSave,
  onCancel,
  className,
  presentation = "nested",
}: BubbleJournalFormProps) {
  const today = getDisplayTodayString();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");
  const [plannedStatus, setPlannedStatus] =
    useState<JournalFormValues["plannedStatus"]>("ongoing");
  const [journeyColor, setJourneyColor] = useState<JourneyColor>(
    defaultJourneyColorForWork(work),
  );
  const [note, setNote] = useState("");
  const isPanel = presentation === "panel";

  return (
    <div
      className={cn(
        "text-left",
        isPanel
          ? "space-y-4"
          : "mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/15 p-4 backdrop-blur-sm",
        className,
      )}
      onClick={(event) => event.stopPropagation()}
    >
      <div>
        <p
          className={cn(
            "font-medium text-white/88",
            isPanel ? "text-left text-lg" : "text-center text-sm",
          )}
        >
          Add to Journal
        </p>
        {isPanel ? (
          <p className="mt-1 text-sm text-white/45">{work.title}</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.14em] text-white/42">
            Start date
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.14em] text-white/42">
            End date
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          />
        </label>
      </div>

      <fieldset>
        <legend className="text-[10px] uppercase tracking-[0.14em] text-white/42">
          Status
        </legend>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {(
            [
              ["planned", "Want"],
              ["ongoing", "Ongoing"],
              ["finished", "Finished"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={plannedStatus === value}
              onClick={(event) => {
                event.stopPropagation();
                setPlannedStatus(value);
              }}
              className={cn(
                "rounded-full border py-2 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                plannedStatus === value
                  ? "border-white/30 bg-white/12 text-white/90"
                  : "border-white/10 text-white/55 hover:bg-white/[0.04]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[10px] uppercase tracking-[0.14em] text-white/42">
          Journey color
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {JOURNEY_COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={JOURNEY_COLOR_STYLES[color].label}
              aria-pressed={journeyColor === color}
              onClick={(event) => {
                event.stopPropagation();
                setJourneyColor(color);
              }}
              className={cn(
                "size-7 rounded-full border-2 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25",
                JOURNEY_COLOR_STYLES[color].highlight,
                journeyColor === color
                  ? "scale-110 border-white/70"
                  : "border-transparent opacity-80 hover:opacity-100",
              )}
            />
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.14em] text-white/42">
          Personal note
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={isPanel ? 3 : 2}
          placeholder="A few words about this moment..."
          className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85 placeholder:text-white/28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        />
      </label>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onCancel();
          }}
          className="rounded-full border border-white/14 py-2.5 text-sm text-white/68 transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSave({
              startDate: startDate || today,
              endDate: endDate || undefined,
              plannedStatus,
              journeyColor,
              note: note.trim() || undefined,
            });
          }}
          className="rounded-full bg-white/92 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          Save
        </button>
      </div>
    </div>
  );
}
