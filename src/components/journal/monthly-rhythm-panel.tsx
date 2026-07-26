"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";

import { formatDurationLabel } from "@/components/habit/CustomDurationInput";
import { JournalMediaSearch } from "@/components/calendar/journal-media-search";
import { MonthNavigator } from "@/components/journal/month-navigator";
import {
  MEDIA_ACTION_OVERLAY_CLASS,
  MEDIA_ACTION_PANEL_CLASS,
} from "@/components/shared/media-action-modal";
import { useActiveMonth } from "@/lib/calendar/active-month-store";
import { TYPE_JOURNEY_COLORS, type MediaItem, type MediaType } from "@/types/media";
import { useJournalEntries } from "@/lib/calendar/journal-store";
import { buildMonthGrid, getWeekdayLabels } from "@/lib/calendar/utils";
import { getContentByMediaKey } from "@/lib/content/bubble-content-bridge";
import type { MediaSearchResult } from "@/lib/content/search";
import { getDisplayTodayString } from "@/lib/habit/habit-utils";
import { useHabitLogs } from "@/lib/habit/habit-store";
import {
  buildDailyJourneyGroups,
  buildRhythmDaySummaries,
  formatMinutesLabel,
  formatRhythmLongDate,
  formatRhythmTimeline,
  getRhythmMeta,
  type RhythmDayEntry,
  type RhythmDaySummary,
  type RhythmPanelType,
} from "@/lib/journal/rhythm-panel-utils";
import { cn } from "@/lib/utils";

type MonthlyRhythmPanelProps = {
  type: RhythmPanelType | null;
  onClose: () => void;
};

type PanelView = "overview" | "day" | "log";
type LogKind = RhythmPanelType | "note";

const DURATION_PRESETS = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
] as const;

const TYPE_COVERS: Record<MediaType, string> = {
  book: "from-teal-900 via-slate-900 to-slate-950",
  movie: "from-sky-900 via-slate-900 to-slate-950",
  music: "from-emerald-900 via-teal-950 to-slate-950",
};

const ADD_MEMORY_ACTIONS: { kind: LogKind; label: string }[] = [
  { kind: "reading", label: "+ Add Reading" },
  { kind: "watching", label: "+ Add Watching" },
  { kind: "listening", label: "+ Add Listening" },
  { kind: "note", label: "+ Add Note" },
];

function minutesBetweenTimes(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (
    [sh, sm, eh, em].some((value) => Number.isNaN(value)) ||
    sh == null ||
    sm == null ||
    eh == null ||
    em == null
  ) {
    return null;
  }
  const startTotal = sh * 60 + sm;
  let endTotal = eh * 60 + em;
  if (endTotal <= startTotal) endTotal += 24 * 60;
  return endTotal - startTotal;
}

function contentTypeToMediaType(
  type: MediaSearchResult["type"],
): MediaType | null {
  if (type === "BOOK") return "book";
  if (type === "MOVIE") return "movie";
  if (type === "MUSIC") return "music";
  return null;
}

function RhythmCharts({
  days,
  barClass,
}: {
  days: RhythmDaySummary[];
  barClass: string;
}) {
  const peak = Math.max(1, ...days.map((day) => day.minutes));
  const width = 360;
  const height = 72;
  const padX = 4;
  const padY = 8;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const coords = days.map((day, index) => {
    const x =
      padX +
      (days.length <= 1 ? innerW / 2 : (index / (days.length - 1)) * innerW);
    const y = padY + innerH - (day.minutes / peak) * innerH;
    return { x, y, minutes: day.minutes };
  });

  const path = coords
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    )
    .join(" ");

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/35">
          Daily activity
        </p>
        <div className="mt-3 flex h-[72px] items-end gap-[2px]">
          {days.map((day) => (
            <div
              key={day.date}
              className="flex min-w-0 flex-1 flex-col items-center justify-end"
              title={`${day.day}: ${formatMinutesLabel(day.minutes)}`}
            >
              <div
                className={cn("w-full max-w-[10px] rounded-t-sm", barClass)}
                style={{
                  height: `${Math.max(day.minutes > 0 ? 8 : 2, (day.minutes / peak) * 100)}%`,
                  opacity: day.minutes > 0 ? 0.85 : 0.18,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/35">
          Monthly rhythm
        </p>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mt-3 h-[72px] w-full overflow-visible"
          role="img"
          aria-label="Monthly rhythm trend"
        >
          <path
            d={path}
            fill="none"
            stroke="rgba(147,172,170,0.7)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

type LogSaveInput = {
  date: string;
  kind: LogKind;
  durationMinutes: number;
  title: string;
  creator: string;
  note: string;
  cover: string;
  startTime?: string;
  endTime?: string;
};

function LogForm({
  kind,
  defaultDate,
  onSave,
  onCancel,
}: {
  kind: LogKind;
  defaultDate: string;
  onSave: (input: LogSaveInput) => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState<LogKind>(kind);
  const [date, setDate] = useState(defaultDate);
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [cover, setCover] = useState("");
  const [note, setNote] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState("45");
  const [timeMode, setTimeMode] = useState(false);

  const timedMinutes = minutesBetweenTimes(startTime, endTime);
  const resolved = timeMode
    ? Math.max(1, timedMinutes ?? 0)
    : customMode
      ? Math.max(1, Math.min(1440, Number.parseInt(customInput, 10) || 0))
      : durationMinutes;

  const categoryMeta =
    category === "note"
      ? { label: "Note", accent: "text-white/80" }
      : getRhythmMeta(category);

  const handleSelectWork = (result: MediaSearchResult) => {
    const mediaType = contentTypeToMediaType(result.type);
    const catalogCover = getContentByMediaKey(result.id)?.cover;
    setTitle(result.title);
    setCreator(result.creator);
    setCover(catalogCover || TYPE_COVERS[mediaType ?? "book"]);
    if (mediaType === "book") setCategory("reading");
    if (mediaType === "movie") setCategory("watching");
    if (mediaType === "music") setCategory("listening");
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/35">
          Start a Memory
        </p>
        <h3 className={cn("font-display mt-1 text-lg font-bold", categoryMeta.accent)}>
          {categoryMeta.label}
        </h3>
        <p className="font-label mt-1 text-[11px] text-white/32">
          {formatRhythmLongDate(date)}
        </p>
      </div>

      <div>
        <p className="font-label mb-2 text-[10px] uppercase tracking-[0.14em] text-white/35">
          Category
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["reading", "Reading"],
              ["watching", "Watching"],
              ["listening", "Listening"],
              ["note", "Note"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={cn(
                "rounded-full border px-3 py-1.5 font-label text-xs transition-colors",
                category === value
                  ? "border-white/18 bg-white/[0.08] text-white/85"
                  : "border-white/10 bg-white/[0.03] text-white/45 hover:text-white/65",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {category !== "note" ? (
        <div className="space-y-2">
          <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/35">
            Choose work
          </p>
          <JournalMediaSearch onSelect={handleSelectWork} />
        </div>
      ) : null}

      <label className="block space-y-1.5">
        <span className="font-label text-[10px] uppercase tracking-[0.14em] text-white/35">
          {category === "note" ? "Note title" : "Title"}
        </span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={
            category === "note" ? "A quiet thought" : `${categoryMeta.label} session`
          }
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-body text-sm text-white/85 outline-none focus:border-white/20"
        />
      </label>

      {category !== "note" ? (
        <label className="block space-y-1.5">
          <span className="font-label text-[10px] uppercase tracking-[0.14em] text-white/35">
            Creator
          </span>
          <input
            type="text"
            value={creator}
            onChange={(event) => setCreator(event.target.value)}
            placeholder="Author / director / artist"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-body text-sm text-white/85 outline-none focus:border-white/20"
          />
        </label>
      ) : null}

      <label className="block space-y-1.5">
        <span className="font-label text-[10px] uppercase tracking-[0.14em] text-white/35">
          Date
        </span>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-label text-sm text-white/85 outline-none focus:border-white/20"
        />
      </label>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/35">
            Time & duration
          </p>
          <button
            type="button"
            onClick={() => setTimeMode((value) => !value)}
            className="font-label text-[10px] uppercase tracking-[0.12em] text-white/40 transition-colors hover:text-white/70"
          >
            {timeMode ? "Use presets" : "Set start / end"}
          </button>
        </div>

        {timeMode ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="font-label text-[10px] uppercase tracking-[0.12em] text-white/32">
                Start
              </span>
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-label text-sm text-white/85 outline-none"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="font-label text-[10px] uppercase tracking-[0.12em] text-white/32">
                End
              </span>
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-label text-sm text-white/85 outline-none"
              />
            </label>
            <p className="col-span-2 font-label text-xs text-white/40">
              Duration{" "}
              <span className="text-white/70">
                {timedMinutes ? formatMinutesLabel(timedMinutes) : "—"}
              </span>
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((option) => (
                <button
                  key={option.minutes}
                  type="button"
                  onClick={() => {
                    setCustomMode(false);
                    setDurationMinutes(option.minutes);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 font-label text-xs transition-colors",
                    !customMode && durationMinutes === option.minutes
                      ? "border-white/18 bg-white/[0.08] text-white/85"
                      : "border-white/10 bg-white/[0.03] text-white/45",
                  )}
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomMode(true)}
                className={cn(
                  "rounded-full border px-3 py-1.5 font-label text-xs transition-colors",
                  customMode
                    ? "border-white/18 bg-white/[0.08] text-white/85"
                    : "border-white/10 bg-white/[0.03] text-white/45",
                )}
              >
                Custom
              </button>
            </div>
            {customMode ? (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={customInput}
                  onChange={(event) => setCustomInput(event.target.value)}
                  className="w-24 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-label text-sm text-white/85 outline-none"
                />
                <span className="font-label text-xs text-white/40">min</span>
              </div>
            ) : null}
          </>
        )}
      </div>

      <label className="block space-y-1.5">
        <span className="font-label text-[10px] uppercase tracking-[0.14em] text-white/35">
          Personal note
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="What did this leave with you?"
          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-body text-sm text-white/85 outline-none focus:border-white/20"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={resolved < 1 || (category === "note" ? !note.trim() && !title.trim() : !title.trim())}
          onClick={() =>
            onSave({
              date,
              kind: category,
              durationMinutes: resolved,
              title:
                title.trim() ||
                (category === "note" ? "Personal note" : `${categoryMeta.label} session`),
              creator: creator.trim() || (category === "note" ? "Journal" : ""),
              note: note.trim(),
              cover:
                cover ||
                TYPE_COVERS[
                  category === "watching"
                    ? "movie"
                    : category === "listening"
                      ? "music"
                      : "book"
                ],
              startTime: timeMode ? startTime || undefined : undefined,
              endTime: timeMode ? endTime || undefined : undefined,
            })
          }
          className="flex-1 rounded-xl border border-white/14 bg-white/[0.08] px-4 py-2.5 font-display text-sm font-bold text-white/85 transition-colors hover:bg-white/[0.12] disabled:opacity-40"
        >
          Save memory
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/10 px-4 py-2.5 font-display text-sm font-bold text-white/45"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function DayDetail({
  date,
  journalEntries,
  habitLogs,
  onBack,
  onAddMemory,
  onEdit,
  onDelete,
}: {
  date: string;
  journalEntries: MediaItem[];
  habitLogs: ReturnType<typeof useHabitLogs>["logs"];
  onBack: () => void;
  onAddMemory: (kind: LogKind) => void;
  onEdit: (entry: RhythmDayEntry, note: string, durationMinutes: number) => void;
  onDelete: (entry: RhythmDayEntry) => void;
}) {
  const groups = useMemo(
    () => buildDailyJourneyGroups(date, habitLogs, journalEntries),
    [date, habitLogs, journalEntries],
  );
  const allEntries = groups.flatMap((group) => group.entries);
  const primary = allEntries[0];
  const [note, setNote] = useState(primary?.note ?? "");
  const [minutes, setMinutes] = useState(
    String(primary?.durationMinutes || 30),
  );
  const [editingId, setEditingId] = useState(primary?.id ?? null);

  const isEmpty = allEntries.length === 0;

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="font-label text-[11px] uppercase tracking-[0.14em] text-white/40 transition-colors hover:text-white/70"
      >
        ← Back
      </button>

      <div>
        <p className="font-label text-[10px] uppercase tracking-[0.18em] text-white/35">
          Muse Rhythm
        </p>
        <h3 className="font-display mt-1 text-xl font-bold text-white/90">
          {formatRhythmLongDate(date)}
        </h3>
      </div>

      {isEmpty ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="font-display text-base text-white/80">Start a Memory</p>
          <p className="font-body mt-1.5 text-sm text-white/42">
            Empty days are open pages — begin a quiet record.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            {ADD_MEMORY_ACTIONS.map((action) => (
              <button
                key={action.kind}
                type="button"
                onClick={() => onAddMemory(action.kind)}
                className={cn(
                  "rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5",
                  "text-left font-display text-sm font-bold text-white/72",
                  "transition-colors hover:bg-white/[0.07] hover:text-white/90",
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/35">
              Daily Journey
            </p>
            <button
              type="button"
              onClick={() => onAddMemory("reading")}
              className="font-label text-[10px] uppercase tracking-[0.12em] text-white/40 transition-colors hover:text-white/70"
            >
              + Add memory
            </button>
          </div>

          {groups.map((group) => (
            <div key={group.type} className="space-y-2.5">
              <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/40">
                {group.label}
              </p>
              {group.entries.map((entry) => {
                const timeline = formatRhythmTimeline(
                  entry.startDate,
                  entry.endDate,
                  entry.date,
                );
                const isEditing = editingId === entry.id;

                return (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"
                  >
                    <p className="font-display text-base font-bold text-white/90">
                      {entry.title}
                    </p>
                    {entry.creator ? (
                      <p className="font-label mt-0.5 text-xs text-white/42">
                        {entry.creator}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-label text-[11px] text-white/40">
                      {entry.durationMinutes > 0 ? (
                        <span>
                          {formatDurationLabel(entry.durationMinutes)}
                        </span>
                      ) : null}
                      {timeline ? <span>{timeline}</span> : null}
                    </div>

                    {isEditing ? (
                      <div className="mt-4 space-y-3">
                        <label className="block space-y-1.5">
                          <span className="font-label text-[10px] uppercase tracking-[0.14em] text-white/35">
                            Note
                          </span>
                          <textarea
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            rows={2}
                            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-body text-sm text-white/85 outline-none"
                          />
                        </label>
                        <label className="block space-y-1.5">
                          <span className="font-label text-[10px] uppercase tracking-[0.14em] text-white/35">
                            Duration (minutes)
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={1440}
                            value={minutes}
                            onChange={(event) => setMinutes(event.target.value)}
                            className="w-28 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-label text-sm text-white/85 outline-none"
                          />
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onEdit(
                                entry,
                                note.trim(),
                                Math.max(1, Number.parseInt(minutes, 10) || 1),
                              )
                            }
                            className="rounded-xl border border-white/14 bg-white/[0.08] px-4 py-2 font-display text-xs font-bold text-white/85"
                          >
                            Save changes
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(entry)}
                            className="rounded-xl border border-white/10 px-4 py-2 font-display text-xs font-bold text-white/45"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {entry.note ? (
                          <p className="font-body mt-3 text-sm leading-relaxed text-white/50">
                            {entry.note}
                          </p>
                        ) : null}
                        {entry.journalId ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(entry.id);
                              setNote(entry.note);
                              setMinutes(String(entry.durationMinutes || 30));
                            }}
                            className="mt-3 font-label text-[10px] uppercase tracking-[0.12em] text-white/35 transition-colors hover:text-white/60"
                          >
                            Edit
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MonthlyRhythmPanelBody({
  type,
  onClose,
}: {
  type: RhythmPanelType;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const { year, month, monthLabel, goPrev, goNext } = useActiveMonth();
  const { logs, saveLog } = useHabitLogs();
  const { entries: journalEntries, addEntry, removeEntry } = useJournalEntries();
  const [view, setView] = useState<PanelView>("overview");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [logKind, setLogKind] = useState<LogKind>(type);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const meta = getRhythmMeta(type);
  const days = useMemo(
    () => buildRhythmDaySummaries(type, year, month, logs, journalEntries),
    [type, year, month, logs, journalEntries],
  );
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const weekdays = getWeekdayLabels();
  const dayByDate = useMemo(
    () => new Map(days.map((day) => [day.date, day])),
    [days],
  );
  const mergeHabit = useCallback(
    (date: string, activityOn: boolean, durationMinutes: number) => {
      const existing = logs.find((log) => log.date === date);
      saveLog(date, {
        read:
          meta.activity === "read" ? activityOn : Boolean(existing?.read),
        watch:
          meta.activity === "watch" ? activityOn : Boolean(existing?.watch),
        listen:
          meta.activity === "listen" ? activityOn : Boolean(existing?.listen),
        duration: durationMinutes,
        photo: existing?.photo,
      });
    },
    [logs, meta, saveLog],
  );

  const handleLogSave = useCallback(
    (input: LogSaveInput) => {
      const mediaType: MediaType =
        input.kind === "watching"
          ? "movie"
          : input.kind === "listening"
            ? "music"
            : "book";
      const rhythmType =
        input.kind === "note" ? type : (input.kind as RhythmPanelType);
      const activityMeta = getRhythmMeta(rhythmType);

      if (input.kind !== "note") {
        const existing = logs.find((log) => log.date === input.date);
        saveLog(input.date, {
          read:
            activityMeta.activity === "read"
              ? true
              : Boolean(existing?.read),
          watch:
            activityMeta.activity === "watch"
              ? true
              : Boolean(existing?.watch),
          listen:
            activityMeta.activity === "listen"
              ? true
              : Boolean(existing?.listen),
          duration: input.durationMinutes,
          photo: existing?.photo,
        });
      }

      const item: MediaItem = {
        id: `rhythm-${mediaType}-${input.date}-${Date.now()}`,
        type: mediaType,
        title: input.title,
        creator: input.creator || "Journal",
        cover: input.cover || TYPE_COVERS[mediaType],
        rating: 0,
        status: "READING",
        date: input.date,
        startDate: input.date,
        endDate: input.date,
        quote: "",
        note: input.note,
        tags:
          input.kind === "note"
            ? ["check-in", "rhythm", "note"]
            : ["check-in", "rhythm"],
        duration: input.durationMinutes,
        durationMinutes: input.durationMinutes,
        journeyColor: TYPE_JOURNEY_COLORS[mediaType],
        memories: [],
        moment:
          input.startTime && input.endTime
            ? `${input.startTime}–${input.endTime}`
            : undefined,
      };

      addEntry(item);
      setSelectedDate(input.date);
      setView("day");
    },
    [addEntry, logs, saveLog, type],
  );

  const handleEdit = useCallback(
    (entry: RhythmDayEntry, note: string, durationMinutes: number) => {
      mergeHabit(entry.date, true, durationMinutes);

      if (entry.journalId) {
        const current = journalEntries.find((item) => item.id === entry.journalId);
        if (current) {
          addEntry({
            ...current,
            note,
            duration: durationMinutes,
            durationMinutes,
          });
        }
      } else {
        const mediaType = entry.mediaType || meta.mediaType;
        addEntry({
          id: `rhythm-${mediaType}-${entry.date}-${Date.now()}`,
          type: mediaType,
          title: entry.title,
          creator: entry.creator || "Journal",
          cover: TYPE_COVERS[mediaType],
          rating: 0,
          status: "READING",
          date: entry.date,
          startDate: entry.startDate || entry.date,
          endDate: entry.endDate || entry.date,
          quote: "",
          note,
          tags: ["check-in", "rhythm"],
          duration: durationMinutes,
          durationMinutes,
          journeyColor: TYPE_JOURNEY_COLORS[mediaType],
          memories: [],
        });
      }
      setView("day");
    },
    [addEntry, journalEntries, mergeHabit, meta],
  );

  const handleDelete = useCallback(
    (entry: RhythmDayEntry) => {
      mergeHabit(entry.date, false, entry.durationMinutes || 0);
      if (entry.journalId) {
        removeEntry(entry.journalId);
      }
      setView("day");
    },
    [mergeHabit, removeEntry],
  );

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close monthly rhythm"
        className={MEDIA_ACTION_OVERLAY_CLASS}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <div className="pointer-events-none fixed inset-0 z-[55] hidden items-center justify-center p-6 md:flex">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${meta.label} monthly rhythm`}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "pointer-events-auto relative flex max-h-[min(88svh,760px)] w-[min(94vw,760px)] flex-col overflow-hidden rounded-[28px] text-white",
            MEDIA_ACTION_PANEL_CLASS,
            "bg-[#0D1117]/82 shadow-[0_28px_90px_rgba(0,0,0,0.45)]",
          )}
        >
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-6 py-4">
                <div className="min-w-0">
                  <p className="font-label text-[10px] uppercase tracking-[0.18em] text-white/35">
                    Muse Rhythm
                  </p>
                  <h2 className="font-display mt-0.5 truncate text-xl font-bold text-white/90">
                    {view === "day" && selectedDate
                      ? formatRhythmLongDate(selectedDate)
                      : view === "log" && selectedDate
                        ? formatRhythmLongDate(selectedDate)
                        : meta.label}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <MonthNavigator
                    monthLabel={monthLabel}
                    onPrev={goPrev}
                    onNext={goNext}
                    size="sm"
                  />
                  <button
                    ref={closeRef}
                    type="button"
                    aria-label="Close"
                    onClick={onClose}
                    className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white/65 transition hover:text-white/90"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${view}-${selectedDate ?? "none"}-${year}-${month}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                  >
                    {view === "log" ? (
                      <LogForm
                        kind={logKind}
                        defaultDate={selectedDate ?? getDisplayTodayString()}
                        onSave={handleLogSave}
                        onCancel={() =>
                          setView(selectedDate ? "day" : "overview")
                        }
                      />
                    ) : null}

                    {view === "day" && selectedDate ? (
                      <DayDetail
                        date={selectedDate}
                        journalEntries={journalEntries}
                        habitLogs={logs}
                        onBack={() => {
                          setView("overview");
                          setSelectedDate(null);
                        }}
                        onAddMemory={(kind) => {
                          setLogKind(kind);
                          setView("log");
                        }}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ) : null}

                    {view === "overview" ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-display text-sm text-white/42">
                            A quiet archive of your {meta.label.toLowerCase()}{" "}
                            this month
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDate(getDisplayTodayString());
                              setLogKind(type);
                              setView("log");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2 font-display text-xs font-bold text-white/75 transition-colors hover:bg-white/[0.1]"
                          >
                            <Plus className="size-3.5" aria-hidden="true" />
                            Log today
                          </button>
                        </div>

                        <div>
                          <div className="grid grid-cols-7 gap-1">
                            {weekdays.map((label) => (
                              <p
                                key={label}
                                className="font-label py-1 text-center text-[10px] uppercase tracking-[0.12em] text-white/30"
                              >
                                {label}
                              </p>
                            ))}
                          </div>
                          <div className="mt-1 grid grid-cols-7 gap-1">
                            {grid.flatMap((week) =>
                              week.days.map((cell, index) => {
                                if (!cell.date || cell.day == null) {
                                  return (
                                    <div
                                      key={`empty-${week.days[0]?.date ?? index}-${index}`}
                                      className="min-h-[64px] rounded-xl"
                                    />
                                  );
                                }

                                const summary = dayByDate.get(cell.date);
                                const active = Boolean(summary?.hasActivity);

                                return (
                                  <button
                                    key={cell.date}
                                    type="button"
                                    onClick={() => {
                                      setSelectedDate(cell.date);
                                      setView("day");
                                    }}
                                    className={cn(
                                      "min-h-[64px] rounded-xl border px-1.5 py-1.5 text-left transition-colors",
                                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/20",
                                      active
                                        ? "border-teal-300/18 bg-teal-400/[0.06]"
                                        : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]",
                                    )}
                                  >
                                    <p className="font-label text-[11px] tabular-nums text-white/55">
                                      {cell.day}
                                    </p>
                                    {active ? (
                                      <>
                                        <p className="font-label mt-1 text-[9px] uppercase tracking-[0.1em] text-white/35">
                                          {meta.typeLabel}
                                        </p>
                                        <p className="font-label mt-0.5 text-[10px] text-white/55">
                                          {formatMinutesLabel(
                                            summary?.minutes ?? 0,
                                          )}
                                        </p>
                                      </>
                                    ) : null}
                                  </button>
                                );
                              }),
                            )}
                          </div>
                        </div>

                        <RhythmCharts days={days} barClass={meta.barClass} />
                      </div>
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </div>
        </motion.div>
      </div>
    </>
  );
}

export function MonthlyRhythmPanel({ type, onClose }: MonthlyRhythmPanelProps) {
  const { year, month } = useActiveMonth();

  return (
    <AnimatePresence>
      {type ? (
        <MonthlyRhythmPanelBody
          key={`${type}-${year}-${month}`}
          type={type}
          onClose={onClose}
        />
      ) : null}
    </AnimatePresence>
  );
}
