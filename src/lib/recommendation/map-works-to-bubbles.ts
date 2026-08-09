/**
 * Map recommended Works into existing Mood Bubble visual slots.
 * Slot geometry / colors / sizes stay keyed by numeric bubble id.
 */

import type { BubbleMood, MediaType, WorkBubble } from "@/components/dashboard/mood-bubble-data";
import {
  buildBubbleVisualShell,
  getBubbleSlotPlan,
} from "@/components/dashboard/mood-bubble-data";
import { resolveBubblePresentation } from "@/lib/localization/content-localization";
import { buildBubbleTeaser } from "@/lib/recommendation/bubble-teaser";
import {
  resolveRecommendationMood,
  type RecommendationMood,
} from "@/lib/recommendation/mood-taxonomy";
import type { Work } from "@/types/work";

function toBubbleMediaType(type: Work["type"]): MediaType {
  if (type === "movie") return "MOVIE";
  if (type === "music") return "MUSIC";
  return "BOOK";
}

function toBubbleMood(mood: RecommendationMood): BubbleMood {
  if (mood === "calm") return "quiet";
  if (mood === "warm") return "warm";
  if (mood === "nostalgic") return "nostalgic";
  if (mood === "curious" || mood === "dreamy") return "curious";
  if (mood === "melancholic") return "melancholic";
  return "reflective";
}

function workTags(work: Work, mood: RecommendationMood): string[] {
  const tags = [...work.moodTags, ...work.genres, mood]
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    if (seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= 4) break;
  }
  return out;
}

export function mapWorksToMoodBubbles(options: {
  works: Work[];
  width: number;
  mood: string;
}): WorkBubble[] {
  const mood = resolveRecommendationMood(options.mood);
  const bubbleMood = toBubbleMood(mood);
  const slots = getBubbleSlotPlan(options.width);
  const pool = options.works;

  if (pool.length === 0) {
    // Visual shells only — no mock literary titles.
    return slots.map((slot) =>
      buildBubbleVisualShell(slot, {
        type: "BOOK",
        title: "",
        creator: "",
        quote: "",
        tags: [mood],
        mood: bubbleMood,
      }),
    );
  }

  return slots.map((slot, index) => {
    const work = pool[index % pool.length]!;
    const featured = slot.alwaysVisible;
    const presentation = resolveBubblePresentation(work, { featured });
    const originalTeaser = presentation.originalTeaser || buildBubbleTeaser(work);

    return buildBubbleVisualShell(slot, {
      type: toBubbleMediaType(work.type),
      title: presentation.originalTitle || work.title,
      creator: presentation.originalCreator || work.creator,
      quote: originalTeaser,
      localizedTitle: presentation.localizedTitle,
      localizedCreator: presentation.localizedCreator,
      localizedQuote: presentation.localizedTeaser,
      tags: workTags(work, mood),
      mood: bubbleMood,
      workId: work.id,
      coverUrl: work.coverUrl,
      source: work.source,
      externalId: work.externalId,
    });
  });
}
