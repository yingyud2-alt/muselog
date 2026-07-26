"use client";

import { useState } from "react";

import { MemoryCover } from "@/components/calendar/memory-cover";
import { MemoryColorPicker } from "@/components/calendar/memory-color-picker";
import { JournalDatePicker } from "@/components/calendar/journal-date-picker";
import { JourneyHighlightBar } from "@/components/calendar/JourneyHighlightBar";
import {
  formatJourneyDay,
  isValidDateString,
} from "@/lib/calendar/journey-utils";
import {
  ongoingStatusLabel,
  resolveSelectionCover,
} from "@/lib/calendar/journal-recommendations";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import type { ContentType } from "@/lib/content/types";
import { TYPE_JOURNEY_COLORS, type JourneyColor } from "@/types/media";
import { cn } from "@/lib/utils";

export type JournalMediaSelection = {
  mediaKey: string;
  type: ContentType;
  title: string;
  creator: string;
  cover: string;
};

export type JournalEntryDraft = {
  mediaKey: string;
  type: ContentType;
  title: string;
  creator: string;
  cover: string;
  startDate: string;
  endDate?: string;
  status: "WANT" | "ONGOING" | "FINISHED";
  journeyColor: JourneyColor;
  rating: number;
  note: string;
  quote: string;
};

const JOURNAL_TYPE_COLORS: Record<ContentType, JourneyColor> = {
  BOOK: TYPE_JOURNEY_COLORS.book,
  MOVIE: TYPE_JOURNEY_COLORS.movie,
  MUSIC: TYPE_JOURNEY_COLORS.music,
};

type JournalEntryFormProps = {
  selection: JournalMediaSelection;
  startDate: string;
  onSave: (draft: JournalEntryDraft) => void;
  onBack: () => void;
  onCancel: () => void;
};

export function JournalEntryForm({
  selection,
  startDate: initialStartDate,
  onSave,
  onBack,
  onCancel,
}: JournalEntryFormProps) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<JournalEntryDraft["status"]>("ONGOING");
  /** Per-memory journey color — independent of any global palette */
  const [journeyColor, setJourneyColor] = useState<JourneyColor>(
    JOURNAL_TYPE_COLORS[selection.type],
  );
  const [note, setNote] = useState("");

  const cover = resolveSelectionCover(selection.mediaKey, selection.cover);
  const previewEnd =
    endDate && isValidDateString(endDate) ? endDate : startDate;
  const showRange = previewEnd !== startDate;

  const statusOptions: {
    value: JournalEntryDraft["status"];
    label: string;
  }[] = [
    { value: "WANT", label: "Want" },
    { value: "ONGOING", label: ongoingStatusLabel(selection.type) },
    { value: "FINISHED", label: "Finished" },
  ];

  const handleSave = () => {
    if (!startDate) return;

    const effectiveEnd =
      status === "FINISHED" && !endDate ? startDate : endDate || undefined;

    onSave({
      mediaKey: selection.mediaKey,
      type: selection.type,
      title: selection.title,
      creator: selection.creator,
      cover,
      startDate,
      endDate: effectiveEnd,
      status,
      journeyColor,
      rating: 0,
      note: note.trim(),
      quote: "",
    });
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-white/40 transition-colors hover:text-white/65"
      >
        ← Back
      </button>

      <div className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.04] p-4">
        <div className="flex items-start gap-4">
          <MemoryCover
            cover={cover}
            title={selection.title}
            className="w-[72px] shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium text-white/92">
              {selection.title}
            </p>
            <p className="truncate text-sm text-white/48">{selection.creator}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/32">
              {CONTENT_TYPE_LABELS[selection.type]}
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <JourneyHighlightBar color={journeyColor} className="h-[3px]" />
          <div className="mt-2 flex items-center gap-2 text-sm text-white/62">
            <span>{formatJourneyDay(startDate)}</span>
            {showRange && (
              <>
                <span className="text-white/25">━━━━━</span>
                <span>{formatJourneyDay(previewEnd)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <JournalDatePicker
        startDate={startDate}
        endDate={endDate}
        journeyColor={journeyColor}
        onStartChange={setStartDate}
        onEndChange={setEndDate}
      />

      <div className="flex gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatus(option.value)}
            className={cn(
              "flex-1 rounded-full border py-2 text-[11px] transition-colors",
              status === option.value
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 text-white/45 hover:bg-white/[0.03]",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <MemoryColorPicker
        value={journeyColor}
        onChange={setJourneyColor}
        label="Journey Color"
      />

      <label className="block space-y-1.5">
        <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">
          Personal note
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="What did this leave you with?"
          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white/80 placeholder:text-white/28 outline-none focus-visible:ring-2 focus-visible:ring-white/12"
        />
      </label>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-white/10 py-2.5 text-sm text-white/50 transition-colors hover:bg-white/[0.03]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!startDate}
          className="flex-1 rounded-full bg-white/90 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white disabled:opacity-40"
        >
          Save to Journal
        </button>
      </div>
    </div>
  );
}
