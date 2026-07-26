"use client";

import { useState } from "react";

import {
  JOURNEY_COLOR_OPTIONS,
  JOURNEY_COLOR_STYLES,
  TYPE_JOURNEY_COLORS,
} from "@/types/media";
import type { JourneyColor, MediaItem, MediaType } from "@/types/media";
import { cn } from "@/lib/utils";

type ManualJournalFormProps = {
  startDate: string;
  onSave: (item: MediaItem) => void;
  onCancel: () => void;
};

const TYPE_OPTIONS: { value: MediaType; label: string }[] = [
  { value: "book", label: "Book" },
  { value: "movie", label: "Movie" },
  { value: "music", label: "Music" },
];

const STATUS_OPTIONS = [
  { value: "WANT" as const, label: "Planned" },
  { value: "READING" as const, label: "Ongoing" },
  { value: "FINISHED" as const, label: "Finished" },
];

export function ManualJournalForm({
  startDate,
  onSave,
  onCancel,
}: ManualJournalFormProps) {
  const [type, setType] = useState<MediaType>("book");
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [cover, setCover] = useState("from-teal-900 via-slate-900 to-slate-950");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<MediaItem["status"]>("READING");
  const [journeyColor, setJourneyColor] = useState<JourneyColor>("teal");

  const handleSave = () => {
    if (!title.trim()) return;

    onSave({
      id: `journal-manual-${Date.now()}`,
      type,
      title: title.trim(),
      creator: creator.trim() || "Unknown",
      cover: cover.trim() || TYPE_JOURNEY_COLORS[type],
      status,
      rating: 0,
      quote: "",
      note: "",
      tags: [],
      date: startDate,
      startDate,
      endDate: endDate || undefined,
      journeyColor,
      memories: [],
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-white/80">Add manually</p>

      <div className="flex gap-2">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setType(opt.value);
              setJourneyColor(TYPE_JOURNEY_COLORS[opt.value]);
            }}
            className={cn(
              "flex-1 rounded-full border py-2 text-xs",
              type === opt.value
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 text-white/45",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85 outline-none"
      />
      <input
        value={creator}
        onChange={(e) => setCreator(e.target.value)}
        placeholder="Creator"
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85 outline-none"
      />
      <input
        value={cover}
        onChange={(e) => setCover(e.target.value)}
        placeholder="Cover gradient classes"
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85 outline-none"
      />

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-white/35">Start</span>
          <input
            type="date"
            value={startDate}
            readOnly
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-white/60"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-white/35">End (optional)</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-xs text-white/80"
          />
        </label>
      </div>

      <div className="flex gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={cn(
              "flex-1 rounded-full border py-1.5 text-[10px]",
              status === opt.value
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 text-white/40",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {JOURNEY_COLOR_OPTIONS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setJourneyColor(color)}
            className={cn(
              "size-6 rounded-full ring-2 ring-offset-2 ring-offset-[#10161D]",
              JOURNEY_COLOR_STYLES[color].highlight,
              journeyColor === color ? "ring-white/40" : "ring-transparent",
            )}
            aria-label={JOURNEY_COLOR_STYLES[color].label}
          />
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-white/10 py-2.5 text-sm text-white/50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim()}
          className="flex-1 rounded-full bg-white/90 py-2.5 text-sm font-medium text-black disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  );
}
