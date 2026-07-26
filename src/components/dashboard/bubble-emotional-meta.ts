import { findCatalogContentForBubble } from "@/lib/content/bubble-content-bridge";
import { EXPLORE_MOODS } from "@/lib/content/constants";
import type { WorkBubble } from "@/components/dashboard/mood-bubble-data";

export type BubbleMoodLabel =
  | "melancholic"
  | "warm"
  | "reflective"
  | "nostalgic"
  | "curious"
  | "quiet";

export type BubbleEmotionalMeta = {
  tags: string[];
  mood: BubbleMoodLabel;
};

const MOOD_FROM_TAG: Record<string, BubbleMoodLabel> = {
  nostalgic: "nostalgic",
  melancholy: "melancholic",
  melancholic: "melancholic",
  longing: "melancholic",
  bittersweet: "melancholic",
  warm: "warm",
  romantic: "warm",
  gentle: "warm",
  reflective: "reflective",
  calm: "reflective",
  still: "quiet",
  quiet: "quiet",
  cozy: "quiet",
  curious: "curious",
  dreamlike: "curious",
  surreal: "curious",
  strange: "curious",
};

const FALLBACK_TAGS = [
  ["quiet", "reflective"],
  ["nostalgic", "warm"],
  ["curious", "dreamlike"],
  ["melancholy", "rainy"],
  ["gentle", "youth"],
] as const;

const FALLBACK_MOODS: BubbleMoodLabel[] = [
  "reflective",
  "nostalgic",
  "warm",
  "melancholic",
  "curious",
  "quiet",
];

function pickMoodFromTags(tags: string[]): BubbleMoodLabel {
  for (const tag of tags) {
    const mood = MOOD_FROM_TAG[tag.toLowerCase()];
    if (mood) return mood;
  }

  for (const exploreMood of EXPLORE_MOODS) {
    if (
      exploreMood.tagMatch.some((match) =>
        tags.some((tag) => tag.toLowerCase().includes(match)),
      )
    ) {
      if (exploreMood.id === "quiet") return "quiet";
      if (exploreMood.id === "nostalgic") return "nostalgic";
      return "curious";
    }
  }

  return "reflective";
}

export function getBubbleEmotionalMeta(
  work: Pick<WorkBubble, "id" | "title" | "creator" | "type" | "tags" | "mood">,
): BubbleEmotionalMeta {
  const catalog = findCatalogContentForBubble(work as WorkBubble);
  const catalogTags = catalog?.tags ?? [];
  const workTags = work.tags ?? [];
  const merged = [...workTags, ...catalogTags].filter(
    (tag, index, list) =>
      list.findIndex((entry) => entry.toLowerCase() === tag.toLowerCase()) ===
      index,
  );

  if (merged.length === 0) {
    const fallback = FALLBACK_TAGS[work.id % FALLBACK_TAGS.length];
    return {
      tags: [...fallback],
      mood: work.mood ?? FALLBACK_MOODS[work.id % FALLBACK_MOODS.length],
    };
  }

  return {
    tags: merged.slice(0, 4),
    mood: work.mood ?? pickMoodFromTags(merged),
  };
}
