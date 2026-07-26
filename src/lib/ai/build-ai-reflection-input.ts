import type { LibraryItem } from "@/lib/library/library-types";
import type {
  AiReflectionActivity,
  AiReflectionInput,
  AiReflectionJournalEntry,
  AiReflectionUserMedia,
} from "@/lib/ai/ai-reflection-types";
import type { MediaItem } from "@/types/media";

export function toAiReflectionUserMedia(
  items: LibraryItem[],
): AiReflectionUserMedia[] {
  return items.map((item) => {
    const userStatus =
      item.status === "WANT"
        ? "want"
        : item.status === "FINISHED"
          ? "finished"
          : item.status === "DROPPED"
            ? "dropped"
            : "reading";

    return {
      title: item.title,
      type: item.type,
      status: item.status,
      userStatus,
      rating: item.rating,
      review: item.shortReview,
      droppedReason: item.status === "DROPPED" ? item.notes : undefined,
      liked: Boolean(item.rating && item.rating >= 4),
      finished: item.status === "FINISHED",
      abandoned: item.status === "DROPPED",
      shortReview: item.shortReview,
      notes: item.notes,
    };
  });
}

export function toAiReflectionJournalEntries(
  entries: MediaItem[],
): AiReflectionJournalEntry[] {
  return entries.map((entry) => ({
    title: entry.title,
    type: entry.type,
    note: entry.note,
    quote: entry.quote,
    tags: entry.tags,
    date: entry.endDate ?? entry.startDate ?? entry.date,
  }));
}

export function toAiReflectionActivities(
  items: LibraryItem[],
  journalEntries: MediaItem[],
): AiReflectionActivity[] {
  const fromJournal = [...journalEntries]
    .sort((left, right) => {
      const leftDate = left.endDate ?? left.startDate ?? left.date;
      const rightDate = right.endDate ?? right.startDate ?? right.date;
      return rightDate.localeCompare(leftDate);
    })
    .slice(0, 5)
    .map((entry) => ({
      label: entry.title,
      date: entry.endDate ?? entry.startDate ?? entry.date,
    }));

  if (fromJournal.length > 0) return fromJournal;

  return [...items]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 5)
    .map((item) => ({
      label: item.title,
      date: item.updatedAt.slice(0, 10),
    }));
}

export function buildAiReflectionInput(
  items: LibraryItem[],
  journalEntries: MediaItem[],
): AiReflectionInput {
  return {
    userMedia: toAiReflectionUserMedia(items),
    journalEntries: toAiReflectionJournalEntries(journalEntries),
    recentActivities: toAiReflectionActivities(items, journalEntries),
  };
}
