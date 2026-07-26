import type { LibraryItem } from "@/lib/library/library-types";
import type { Content } from "@/lib/content/types";
import type { MediaItem } from "@/types/media";

export function formatArchiveDate(value?: string): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) return `${match[1]}.${match[2]}.${match[3]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export function formatDuration(start?: string, end?: string): string {
  if (!start) return "—";

  const startMs = Date.parse(start);
  const endMs = Date.parse(end ?? start);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return "—";

  const days = Math.max(1, Math.round((endMs - startMs) / 86_400_000) + 1);
  return days === 1 ? "1 day" : `${days} days`;
}

export function personalSentence(
  item: LibraryItem | null,
  content: Content | null,
): string {
  const review = item?.shortReview?.trim();
  if (review) return review;

  const notes = item?.notes?.trim();
  if (notes) return notes;

  if (content?.description) {
    return "Why this work stayed with me — still waiting for your words.";
  }

  return "Why this work stayed with me.";
}

export type WorkJournalRecord = {
  id: string;
  date: string;
  reflection: string;
  photo?: string;
};

export function buildJournalRecords(
  journalEntry: MediaItem | null,
  photos: string[],
  item: LibraryItem | null,
): WorkJournalRecord[] {
  const records: WorkJournalRecord[] = [];

  if (journalEntry) {
    const reflection =
      journalEntry.note?.trim() ||
      journalEntry.quote?.trim() ||
      "A quiet mark in your archive.";
    const entryPhotos = [
      ...(journalEntry.memories ?? []),
      ...photos,
    ].filter(Boolean);

    records.push({
      id: journalEntry.id,
      date: journalEntry.date,
      reflection,
      photo: entryPhotos[0],
    });
  } else if (item?.shortReview?.trim() || item?.notes?.trim()) {
    records.push({
      id: `library-${item.mediaKey}`,
      date: item.endDate ?? item.startDate ?? item.updatedAt,
      reflection: item.shortReview?.trim() || item.notes!.trim(),
      photo: undefined,
    });
  }

  return records;
}

export function tasteInsightPlaceholder(tags: string[]): {
  summary: string;
  emotional: string;
  narrative: string;
  aesthetic: string;
} {
  const themes = tags.slice(0, 3);
  const themeLine =
    themes.length > 0
      ? themes.join(", ").replace(/, ([^,]*)$/, ", and $1")
      : "quiet narratives, human relationships, and reflective spaces";

  return {
    summary: `You often connect with ${themeLine}.`,
    emotional: "Soft melancholy, tenderness, and unhurried feeling.",
    narrative: "Patient storytelling with quiet human connections.",
    aesthetic: "Muted light, still rooms, and restrained atmosphere.",
  };
}
