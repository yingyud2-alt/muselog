import type { MediaStatus, MediaType } from "@/types/media";

export const MEDIA_TYPE_EMOJI: Record<MediaType, string> = {
  book: "📖",
  movie: "🎬",
  music: "🎵",
};

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  book: "Book",
  movie: "Movie",
  music: "Music",
};

export const MEDIA_STATUS_LABELS: Record<MediaStatus, string> = {
  WANT: "Want",
  READING: "Reading",
  FINISHED: "Finished",
};

/** Default calendar month — deterministic for SSR. */
export const CALENDAR_DEFAULT_YEAR = 2026;
export const CALENDAR_DEFAULT_MONTH = 7;

export const MONTH_MOOD_TAGLINES: Record<string, string> = {
  quiet: "A month of quiet stories",
  nostalgic: "A month of half-remembered feelings",
  calm: "A month of stillness",
  melancholy: "A month of tender grief",
  reflective: "A month of inward light",
  gentle: "A month of gentle discoveries",
};

/** Deterministic reading progress from id (40–88%). */
export function getReadingProgress(id: string): number {
  let hash = 0;

  for (let index = 0; index < id.length; index += 1) {
    hash = (hash + id.charCodeAt(index) * (index + 1)) % 97;
  }

  return 40 + (hash % 49);
}
