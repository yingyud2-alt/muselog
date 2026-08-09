"use client";

import { useMemo, useState } from "react";
import { ImageIcon } from "lucide-react";

import { JournalMediaSearch } from "@/components/calendar/journal-media-search";
import { MoodTagPicker } from "@/components/explore/mood-tag-picker";
import { LibraryPanelShell } from "@/components/library/library-panel-shell";
import { normalizeCalendarDate } from "@/lib/calendar/calendar-date";
import {
  upsertJournalEntry,
  useJournalEntries,
} from "@/lib/calendar/journal-store";
import {
  getJourneyEnd,
  getJourneyStart,
} from "@/lib/calendar/journey-utils";
import {
  buildJournalItemFromMediaKey,
  getContentByMediaKey,
  mediaKeyFromJournalItemId,
} from "@/lib/content/bubble-content-bridge";
import { getContentById } from "@/lib/content/content-data";
import type { MediaSearchResult } from "@/lib/content/search";
import type { ContentType } from "@/lib/content/types";
import { upsertUserMediaState } from "@/lib/content/user-media-state";
import type { WorkPreviewSnapshot } from "@/lib/detail/detail-overlay-store";
import { getDisplayTodayString } from "@/lib/habit/habit-utils";
import { resolveCoverUrl } from "@/lib/work/cover-url";
import { getImportedWorkById } from "@/lib/work/imported-work-catalog";
import { toContentType } from "@/lib/work/work-adapters";
import { resolveWorkRouteId } from "@/lib/work/work-route";
import { cn } from "@/lib/utils";
import type { MediaItem, MediaStatus, MediaType } from "@/types/media";

type QuickMemoryActivity = {
  id: string;
  label: string;
  mediaStatus: MediaStatus;
};

type JournalQuickLogModalProps = {
  /** Empty → create flow with work search. */
  workId: string;
  onClose: () => void;
  snapshot?: WorkPreviewSnapshot | null;
  initialDate?: string;
  entryId?: string;
  lockScroll?: boolean;
  zIndex?: number;
};

function activitiesForType(type: ContentType): QuickMemoryActivity[] {
  if (type === "MOVIE") {
    return [
      {
        id: "started_watching",
        label: "Started watching",
        mediaStatus: "READING",
      },
      {
        id: "finished_watching",
        label: "Finished watching",
        mediaStatus: "FINISHED",
      },
    ];
  }
  if (type === "MUSIC") {
    return [
      {
        id: "started_listening",
        label: "Started listening",
        mediaStatus: "READING",
      },
      {
        id: "finished_listening",
        label: "Finished listening",
        mediaStatus: "FINISHED",
      },
    ];
  }
  return [
    {
      id: "started_reading",
      label: "Started reading",
      mediaStatus: "READING",
    },
    {
      id: "continued_reading",
      label: "Continued reading",
      mediaStatus: "READING",
    },
    {
      id: "finished",
      label: "Finished",
      mediaStatus: "FINISHED",
    },
  ];
}

function activityIdFromMoment(
  moment: string | undefined,
  activities: QuickMemoryActivity[],
): string {
  if (!moment) return activities[0]?.id ?? "started_reading";
  const match = activities.find(
    (item) => item.label.toLowerCase() === moment.toLowerCase(),
  );
  return match?.id ?? activities[0]?.id ?? "started_reading";
}

type JournalQuickLogFormProps = {
  workIdProp: string;
  onClose: () => void;
  snapshot: WorkPreviewSnapshot | null;
  initialDate?: string;
  entryId?: string;
  existing: MediaItem | null;
  lockScroll: boolean;
  zIndex: number;
};

/**
 * Form body keyed by memory identity so useState initializes from `existing`
 * without syncing via useEffect setState.
 */
function JournalQuickLogForm({
  workIdProp,
  onClose,
  snapshot,
  initialDate,
  entryId,
  existing,
  lockScroll,
  zIndex,
}: JournalQuickLogFormProps) {
  const { addEntry } = useJournalEntries();
  const isEditing = Boolean(entryId);

  const [selectedWorkId, setSelectedWorkId] = useState(
    workIdProp ||
      (existing ? mediaKeyFromJournalItemId(existing.id) : "") ||
      "",
  );
  const [pickedSnapshot, setPickedSnapshot] =
    useState<WorkPreviewSnapshot | null>(null);

  const resolvedId = useMemo(
    () => (selectedWorkId ? resolveWorkRouteId(selectedWorkId) : ""),
    [selectedWorkId],
  );

  const catalog = resolvedId
    ? (getContentById(resolvedId) ?? getContentByMediaKey(resolvedId))
    : null;
  const imported = resolvedId ? getImportedWorkById(resolvedId) : null;

  const title =
    existing?.title ??
    catalog?.title ??
    imported?.title ??
    pickedSnapshot?.title ??
    snapshot?.title ??
    "";
  const creator =
    existing?.creator ??
    catalog?.creator ??
    imported?.creator ??
    pickedSnapshot?.creator ??
    snapshot?.creator ??
    "";
  const type: ContentType =
    (existing
      ? existing.type === "movie"
        ? "MOVIE"
        : existing.type === "music"
          ? "MUSIC"
          : "BOOK"
      : undefined) ??
    catalog?.type ??
    (imported ? toContentType(imported.type) : undefined) ??
    pickedSnapshot?.type ??
    snapshot?.type ??
    "BOOK";
  const cover = resolveCoverUrl(
    imported?.coverUrl,
    pickedSnapshot?.cover,
    snapshot?.cover,
    existing?.cover,
    catalog?.cover,
  );

  const activities = activitiesForType(type);
  const today = getDisplayTodayString();
  const seedDate =
    normalizeCalendarDate(initialDate) ??
    (existing ? getJourneyStart(existing) : null) ??
    today;

  const [startDate, setStartDate] = useState(
    existing ? getJourneyStart(existing) : seedDate,
  );
  const [endDate, setEndDate] = useState(
    existing ? getJourneyEnd(existing) : seedDate,
  );
  const [activityId, setActivityId] = useState(() =>
    activityIdFromMoment(existing?.moment, activitiesForType(type)),
  );
  const [moodTags, setMoodTags] = useState<string[]>(existing?.tags ?? []);
  const [note, setNote] = useState(existing?.note ?? existing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const selectedActivity =
    activities.find((item) => item.id === activityId) ?? activities[0];

  const needsWork = !resolvedId && !isEditing;
  const normalizedStart = normalizeCalendarDate(startDate);
  const normalizedEnd = normalizeCalendarDate(endDate);
  const canSave =
    Boolean(selectedActivity) &&
    Boolean(normalizedStart) &&
    Boolean(normalizedEnd) &&
    (Boolean(resolvedId) || isEditing);

  const handlePickWork = (result: MediaSearchResult) => {
    setSelectedWorkId(result.id);
    setPickedSnapshot({
      title: result.title,
      creator: result.creator,
      type: result.type,
      cover: result.coverUrl,
    });
  };

  const handleSave = () => {
    if (saving || !selectedActivity || !canSave) return;
    if (!normalizedStart || !normalizedEnd) return;

    setSaving(true);

    const mediaStatus = selectedActivity.mediaStatus;
    const trimmedNote = note.trim();
    const nextStart = normalizedStart;
    let nextEnd = normalizedEnd;
    if (nextEnd < nextStart) nextEnd = nextStart;

    const mediaType: MediaType =
      type === "MOVIE" ? "movie" : type === "MUSIC" ? "music" : "book";

    if (isEditing && entryId) {
      const base: MediaItem = existing ?? {
        id: entryId,
        type: mediaType,
        title: title || "Untitled",
        creator: creator || "",
        cover: cover || "from-slate-800 via-slate-900 to-black",
        rating: 0,
        status: mediaStatus,
        date: nextStart,
        quote: "",
        note: trimmedNote,
        tags: moodTags,
        memories: [],
      };

      upsertJournalEntry({
        ...base,
        status: mediaStatus,
        date: nextStart,
        startDate: nextStart,
        endDate: nextEnd,
        note: trimmedNote,
        notes: trimmedNote,
        tags: moodTags,
        moment: selectedActivity.label,
        title: title || base.title,
        creator: creator || base.creator,
        cover: cover || base.cover,
      });
      onClose();
      return;
    }

    const entry = buildJournalItemFromMediaKey(
      resolvedId,
      {
        status: mediaStatus,
        date: nextStart,
        startDate: nextStart,
        endDate: nextEnd,
        title,
        note: trimmedNote,
        notes: trimmedNote,
        tags: moodTags,
        moment: selectedActivity.label,
      },
      {
        title,
        creator,
        cover,
        type,
        tags: moodTags,
      },
    );

    // buildJournalItemFromMediaKey already persists canonical API workId.
    const canonicalMediaKey = mediaKeyFromJournalItemId(entry.id);
    addEntry(entry);

    upsertUserMediaState(canonicalMediaKey, {
      status: mediaStatus === "FINISHED" ? "FINISHED" : "ONGOING",
      startDate: nextStart,
      endDate: nextEnd,
      addedToJournal: true,
      notes: trimmedNote || undefined,
      shortReview: trimmedNote || undefined,
      title,
      creator,
      cover: entry.cover,
      mediaType: type,
    });

    onClose();
  };

  return (
    <LibraryPanelShell
      open
      title="Quick Memory"
      onClose={onClose}
      wide={false}
      lockScroll={lockScroll}
      zIndex={zIndex}
    >
      <div className="space-y-5 md:pr-4">
        <header>
          <p className="font-label text-[10px] uppercase tracking-[0.18em] text-white/32">
            Quick Memory
          </p>
          {title ? (
            <>
              <p className="mt-2 font-display text-[18px] font-medium leading-snug text-white/92">
                {title}
              </p>
              <p className="mt-1 text-[13px] text-white/40">{creator}</p>
            </>
          ) : (
            <p className="mt-2 text-[14px] text-white/50">
              Pick a work for this memory.
            </p>
          )}
        </header>

        {needsWork ? <JournalMediaSearch onSelect={handlePickWork} /> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="font-label text-[10px] uppercase tracking-[0.14em] text-white/38">
              Start date
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/88 outline-none focus-visible:ring-1 focus-visible:ring-white/20"
            />
          </label>
          <label className="block">
            <span className="font-label text-[10px] uppercase tracking-[0.14em] text-white/38">
              End date
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/88 outline-none focus-visible:ring-1 focus-visible:ring-white/20"
            />
          </label>
        </div>

        {!needsWork ? (
          <>
            <fieldset>
              <legend className="font-label text-[10px] uppercase tracking-[0.14em] text-white/38">
                Activity
              </legend>
              <div
                className={cn(
                  "mt-2 grid gap-1.5",
                  activities.length > 2
                    ? "grid-cols-1"
                    : "grid-cols-1 sm:grid-cols-2",
                )}
              >
                {activities.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selectedActivity?.id === option.id}
                    onClick={() => setActivityId(option.id)}
                    className={cn(
                      "rounded-full border px-3 py-2 text-left text-[13px] transition-colors",
                      selectedActivity?.id === option.id
                        ? "border-white/28 bg-white/[0.1] text-white/90"
                        : "border-white/10 text-white/50 hover:border-white/18 hover:text-white/72",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/38">
                Mood
                <span className="ml-2 normal-case tracking-normal text-white/22">
                  optional
                </span>
              </p>
              <div className="mt-2">
                <MoodTagPicker value={moodTags} onChange={setMoodTags} />
              </div>
            </div>

            <label className="block">
              <span className="font-label text-[10px] uppercase tracking-[0.14em] text-white/38">
                Reflection
                <span className="ml-2 normal-case tracking-normal text-white/22">
                  optional
                </span>
              </span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, 280))}
                rows={3}
                maxLength={280}
                placeholder="What this work left you with…"
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm leading-relaxed text-white/88 outline-none placeholder:text-white/24 focus-visible:ring-1 focus-visible:ring-white/20"
              />
            </label>

            <div
              aria-disabled="true"
              className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-3 text-white/28"
            >
              <ImageIcon className="size-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-[12px] text-white/36">Photo</p>
                <p className="text-[11px] text-white/22">Coming later</p>
              </div>
            </div>
          </>
        ) : null}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/14 py-2.5 text-sm text-white/62 transition-colors hover:border-white/24 hover:text-white/80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !canSave}
            className="rounded-full border border-white/20 bg-white/[0.1] py-2.5 text-sm text-white/90 transition-colors hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isEditing ? "Update memory" : "Save memory"}
          </button>
        </div>
      </div>
    </LibraryPanelShell>
  );
}

/**
 * Quick Memory — cultural moment editor (dates + reflection, not duration).
 */
export function JournalQuickLogModal({
  workId: workIdProp,
  onClose,
  snapshot = null,
  initialDate,
  entryId,
  lockScroll = false,
  zIndex = 74,
}: JournalQuickLogModalProps) {
  const { entries } = useJournalEntries();
  const existing = entryId
    ? (entries.find((item) => item.id === entryId) ?? null)
    : null;

  // Remount form when the edited memory identity changes so state
  // initializes from `existing` without syncing setState in effects.
  const formKey =
    existing?.id ??
    `new:${workIdProp || "search"}:${initialDate ?? "today"}`;

  return (
    <JournalQuickLogForm
      key={formKey}
      workIdProp={workIdProp}
      onClose={onClose}
      snapshot={snapshot}
      initialDate={initialDate}
      entryId={entryId}
      existing={existing}
      lockScroll={lockScroll}
      zIndex={zIndex}
    />
  );
}
