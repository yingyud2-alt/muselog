"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Film, Headphones, X } from "lucide-react";

import {
  MEDIA_ACTION_OVERLAY_CLASS,
  MEDIA_ACTION_PANEL_CLASS,
} from "@/components/shared/media-action-modal";
import { MEDIA_TYPE_LABELS } from "@/lib/calendar/constants";
import { normalizeCalendarDate } from "@/lib/calendar/calendar-date";
import { useJournalEntries } from "@/lib/calendar/journal-store";
import { getDisplayTodayString } from "@/lib/habit/habit-utils";
import { journalAccent } from "@/lib/preferences/journal-accent-classes";
import { cn } from "@/lib/utils";
import {
  TYPE_JOURNEY_COLORS,
  type MediaItem,
  type MediaType,
} from "@/types/media";

const DURATION_PRESETS = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
] as const;

const TYPE_OPTIONS: {
  type: MediaType;
  label: string;
  compactLabel: string;
  emoji: string;
  Icon: typeof BookOpen;
}[] = [
  {
    type: "book",
    label: "BOOK",
    compactLabel: "Reading",
    emoji: "📖",
    Icon: BookOpen,
  },
  {
    type: "movie",
    label: "MOVIE",
    compactLabel: "Watching",
    emoji: "🎬",
    Icon: Film,
  },
  {
    type: "music",
    label: "MUSIC",
    compactLabel: "Listening",
    emoji: "🎵",
    Icon: Headphones,
  },
];

const TYPE_COVERS: Record<MediaType, string> = {
  book: "from-teal-900 via-slate-900 to-slate-950",
  movie: "from-sky-900 via-slate-900 to-slate-950",
  music: "from-emerald-900 via-teal-950 to-slate-950",
};

const TYPE_TITLES: Record<MediaType, string> = {
  book: "Quick reading",
  movie: "Quick watching",
  music: "Quick listening",
};

type QuickCheckInProps = {
  variant?: "card" | "modal";
  /** compact = horizontal journal strip under the calendar */
  density?: "default" | "compact";
  open?: boolean;
  onClose?: () => void;
  className?: string;
  onSaved?: () => void;
};

function buildCheckInEntry(
  type: MediaType,
  durationMinutes: number,
  date: string,
): MediaItem {
  const calendarDate = date;
  return {
    id: `checkin-${type}-${calendarDate}-${Date.now()}`,
    type,
    title: TYPE_TITLES[type],
    creator: "Today",
    cover: TYPE_COVERS[type],
    rating: 0,
    status: "READING",
    date: calendarDate,
    startDate: calendarDate,
    endDate: calendarDate,
    quote: "",
    note: "Checked in",
    tags: ["check-in"],
    duration: durationMinutes,
    durationMinutes,
    journeyColor: TYPE_JOURNEY_COLORS[type],
    memories: [],
    moment: `quick ${MEDIA_TYPE_LABELS[type].toLowerCase()} session`,
  };
}

function QuickCheckInForm({
  onSaved,
  onCancel,
  compact = false,
  density = "default",
}: {
  onSaved?: () => void;
  onCancel?: () => void;
  compact?: boolean;
  density?: "default" | "compact";
}) {
  const { addEntry } = useJournalEntries();
  const [type, setType] = useState<MediaType | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState("45");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const resolvedMinutes = customMode
    ? Math.max(1, Math.min(24 * 60, Number.parseInt(customInput, 10) || 0))
    : (durationMinutes ?? 0);

  const isStrip = density === "compact";
  const canSave = Boolean(type) && resolvedMinutes >= 1;

  const handleSave = useCallback(() => {
    if (!type || !resolvedMinutes || resolvedMinutes < 1) return;

    setSaving(true);
    const today =
      normalizeCalendarDate(getDisplayTodayString()) ?? getDisplayTodayString();
    addEntry(buildCheckInEntry(type, resolvedMinutes, today));
    setSaving(false);
    setSaved(true);
    onSaved?.();

    window.setTimeout(() => {
      setSaved(false);
      onCancel?.();
    }, 700);
  }, [addEntry, onCancel, onSaved, resolvedMinutes, type]);

  return (
    <div className={cn(isStrip ? "space-y-4" : compact ? "space-y-5" : "space-y-6")}>
      <div className={cn(isStrip && "flex flex-wrap items-end justify-between gap-3")}>
        <div>
          <p className="font-label text-[10px] uppercase tracking-[0.18em] text-white/35">
            Today
          </p>
          <h2
            className={cn(
              "font-display mt-1 font-bold tracking-tight text-white/92",
              isStrip ? "text-lg" : "text-xl",
            )}
          >
            Quick Check-in
          </h2>
          {!isStrip ? (
            <p className="font-display mt-1.5 text-sm text-white/42">
              Log a small moment in your cultural day
            </p>
          ) : null}
        </div>

        {isStrip ? (
          <div className="flex flex-wrap items-center gap-2">
            {DURATION_PRESETS.map((option) => {
              const active = !customMode && durationMinutes === option.minutes;

              return (
                <button
                  key={option.minutes}
                  type="button"
                  onClick={() => {
                    setCustomMode(false);
                    setDurationMinutes((current) =>
                      current === option.minutes ? null : option.minutes,
                    );
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1 font-label text-[11px] transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2",
                    journalAccent.ring,
                    active
                      ? journalAccent.activeChip
                      : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white/72",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !canSave}
              className={cn(
                "inline-flex items-center justify-center rounded-full",
                "border px-3.5 py-1.5",
                "font-display text-xs font-bold",
                "transition-colors",
                "focus-visible:outline-none focus-visible:ring-2",
                journalAccent.primaryButton,
                "disabled:opacity-50",
              )}
            >
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        ) : null}
      </div>

      <div>
        {!isStrip ? (
          <p className="font-label mb-2 text-[10px] uppercase tracking-[0.14em] text-white/35">
            Media type
          </p>
        ) : null}
        <div
          className={cn(
            isStrip
              ? "grid grid-cols-1 gap-2 sm:grid-cols-3"
              : "grid grid-cols-3 gap-2",
          )}
        >
          {TYPE_OPTIONS.map((option) => {
            const active = type === option.type;
            const Icon = option.Icon;

            return (
              <button
                key={option.type}
                type="button"
                onClick={() =>
                  setType((current) =>
                    current === option.type ? null : option.type,
                  )
                }
                className={cn(
                  "transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2",
                  journalAccent.ring,
                  isStrip
                    ? "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left"
                    : "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3",
                  active
                    ? cn(journalAccent.border, journalAccent.bg, "text-white/90")
                    : "border-white/[0.08] bg-white/[0.03] text-white/55 hover:bg-white/[0.05]",
                )}
              >
                <span className="text-base" aria-hidden="true">
                  {option.emoji}
                </span>
                {!isStrip ? (
                  <Icon className="size-3.5 opacity-70" aria-hidden="true" />
                ) : (
                  <Icon className="size-4 opacity-70" aria-hidden="true" />
                )}
                <span
                  className={cn(
                    isStrip
                      ? "font-display text-sm font-normal text-white/80"
                      : "font-label text-[10px] tracking-[0.08em]",
                  )}
                >
                  {isStrip ? option.compactLabel : option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!isStrip ? (
        <>
          <div>
            <p className="font-label mb-2 text-[10px] uppercase tracking-[0.14em] text-white/35">
              Duration
            </p>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((option) => {
                const active = !customMode && durationMinutes === option.minutes;

                return (
                  <button
                    key={option.minutes}
                    type="button"
                    onClick={() => {
                      setCustomMode(false);
                      setDurationMinutes((current) =>
                        current === option.minutes ? null : option.minutes,
                      );
                    }}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 font-label text-xs transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2",
                      journalAccent.ring,
                      active
                        ? journalAccent.activeChip
                        : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white/72",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setCustomMode((current) => {
                    if (current) {
                      setDurationMinutes(null);
                      return false;
                    }
                    setDurationMinutes(null);
                    return true;
                  });
                }}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 font-label text-xs transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2",
                  journalAccent.ring,
                  customMode
                    ? journalAccent.activeChip
                    : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white/72",
                )}
              >
                Custom
              </button>
            </div>

            {customMode ? (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={customInput}
                  onChange={(event) => setCustomInput(event.target.value)}
                  className={cn(
                    "w-28 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-label text-sm text-white/85 outline-none",
                    journalAccent.focusBorder,
                  )}
                  aria-label="Custom duration in minutes"
                />
                <span className="font-label text-xs text-white/40">minutes</span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !canSave}
              className={cn(
                "inline-flex flex-1 items-center justify-center rounded-full",
                "border px-4 py-2.5",
                "font-display text-sm font-bold",
                "transition-colors",
                "focus-visible:outline-none focus-visible:ring-2",
                journalAccent.primaryButton,
                "disabled:opacity-50",
              )}
            >
              {saved ? "Saved" : "Save"}
            </button>
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-white/10 px-4 py-2.5 font-display text-sm font-bold text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white/70"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function QuickCheckIn({
  variant = "card",
  density = "default",
  open = false,
  onClose,
  className,
  onSaved,
}: QuickCheckInProps) {
  if (variant === "modal") {
    return (
      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Close quick check-in"
              className={MEDIA_ACTION_OVERLAY_CLASS}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <div className="pointer-events-none fixed inset-0 z-50 hidden items-center justify-center p-8 md:flex">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Quick Check-in"
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.99 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className={cn(
                  "pointer-events-auto relative w-[min(92vw,420px)] rounded-3xl p-6 text-white",
                  MEDIA_ACTION_PANEL_CLASS,
                  className,
                )}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white/65 transition hover:text-white/90"
                >
                  <X className="size-3.5" />
                </button>
                <QuickCheckInForm
                  compact
                  onSaved={onSaved}
                  onCancel={onClose}
                />
              </motion.div>
            </div>
          </>
        ) : null}
      </AnimatePresence>
    );
  }

  return (
    <section
      className={cn(
        "rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl",
        density === "compact"
          ? "p-4 shadow-[0_10px_28px_rgba(0,0,0,0.16)] md:p-5"
          : "p-5 shadow-[0_14px_40px_rgba(0,0,0,0.2)] md:p-6",
        className,
      )}
      aria-label="Quick check-in"
    >
      <QuickCheckInForm density={density} onSaved={onSaved} />
    </section>
  );
}
