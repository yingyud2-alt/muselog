import type { ContentType, MemoryStatus } from "./types";

export type ExploreMood = "quiet" | "nostalgic" | "curious";

export const EXPLORE_MOODS: Array<{
  id: ExploreMood;
  label: string;
  tagMatch: string[];
}> = [
  {
    id: "quiet",
    label: "Quiet",
    tagMatch: ["quiet", "calm", "reflective", "cozy", "gentle", "still"],
  },
  {
    id: "nostalgic",
    label: "Nostalgic",
    tagMatch: ["nostalgic", "melancholy", "memory", "bittersweet", "longing"],
  },
  {
    id: "curious",
    label: "Curious",
    tagMatch: ["curious", "dreamlike", "surreal", "mysterious", "strange"],
  },
];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  BOOK: "Book",
  MOVIE: "Movie",
  MUSIC: "Music",
};

export const CREATOR_LABELS: Record<ContentType, string> = {
  BOOK: "Author",
  MOVIE: "Director",
  MUSIC: "Artist",
};

export const MEMORY_STATUS_OPTIONS: Array<{
  value: MemoryStatus;
  label: string;
}> = [
  { value: "WANT", label: "Want" },
  { value: "READING", label: "Reading" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
];

export const MEMORY_MOOD_TAGS = [
  { id: "calm", emoji: "🌙", label: "Calm" },
  { id: "melancholy", emoji: "🌧", label: "Melancholy" },
  { id: "warm", emoji: "☀", label: "Warm" },
  { id: "nostalgic", emoji: "🍂", label: "Nostalgic" },
  { id: "dreamy", emoji: "✨", label: "Dreamy" },
  { id: "hopeful", emoji: "🌱", label: "Hopeful" },
  { id: "intense", emoji: "🔥", label: "Intense" },
  { id: "cozy", emoji: "🫖", label: "Cozy" },
] as const;

export function contentMatchesExploreMood(
  tags: string[],
  mood: ExploreMood,
): boolean {
  const config = EXPLORE_MOODS.find((item) => item.id === mood);

  if (!config) {
    return true;
  }

  return tags.some((tag) => config.tagMatch.includes(tag.toLowerCase()));
}
