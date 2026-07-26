import type { LibraryItem } from "@/lib/library/library-types";

const TYPE_MOODS: Record<LibraryItem["type"], string[]> = {
  BOOK: ["reflective", "quiet", "literary"],
  MOVIE: ["visual", "slow cinema", "human"],
  MUSIC: ["soft", "night", "ambient"],
};

/** Presentation-only mood labels derived from type + notes. */
export function deriveLibraryMoodTags(item: LibraryItem): string[] {
  const pool = TYPE_MOODS[item.type];
  const blob = `${item.notes ?? ""} ${item.shortReview ?? ""}`.toLowerCase();
  const fromNotes = pool.filter((tag) => blob.includes(tag.split(" ")[0]!));

  if (fromNotes.length >= 2) return fromNotes.slice(0, 2);

  let hash = 0;
  for (let i = 0; i < item.title.length; i += 1) {
    hash = (hash + item.title.charCodeAt(i) * (i + 1)) % pool.length;
  }

  const first = pool[hash]!;
  const second = pool[(hash + 1) % pool.length]!;
  return [first, second];
}

export function formatLibraryAddedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
