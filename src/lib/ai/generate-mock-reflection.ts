import type {
  AiReflectionActivity,
  AiReflectionInput,
  AiReflectionJournalEntry,
  AiReflectionResult,
  AiReflectionUserMedia,
} from "@/lib/ai/ai-reflection-types";

const FALLBACK_THEMES = [
  "quiet stories",
  "emotional connections",
  "nostalgic sounds",
];

const THEME_KEYWORDS: Record<string, string[]> = {
  "quiet stories": [
    "quiet",
    "calm",
    "still",
    "gentle",
    "soft",
    "silent",
    "peaceful",
    "book",
  ],
  "emotional connections": [
    "human",
    "intimate",
    "warm",
    "tender",
    "love",
    "relationship",
    "heart",
    "connection",
  ],
  "nostalgic sounds": [
    "nostalgic",
    "melancholy",
    "longing",
    "memory",
    "past",
    "bittersweet",
    "music",
  ],
  "slow living": ["slow", "reflective", "contemplative", "meditative", "routine"],
  "curious worlds": ["curious", "dreamlike", "surreal", "mystery", "wonder"],
};

function collectBlob(input: AiReflectionInput): string {
  const parts: string[] = [];

  for (const item of input.userMedia) {
    parts.push(item.title, item.type, item.status ?? "");
    parts.push(...(item.tags ?? []));
    if (item.shortReview) parts.push(item.shortReview);
    if (item.notes) parts.push(item.notes);
  }

  for (const entry of input.journalEntries) {
    parts.push(entry.title, entry.type);
    parts.push(...(entry.tags ?? []));
    if (entry.note) parts.push(entry.note);
    if (entry.quote) parts.push(entry.quote);
  }

  for (const activity of input.recentActivities) {
    parts.push(activity.label);
  }

  return parts.join(" ").toLowerCase();
}

function extractThemes(blob: string): string[] {
  const scored: Array<{ theme: string; score: number }> = [];

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      const matches = blob.match(new RegExp(`\\b${keyword}\\b`, "gi"));
      if (matches) score += matches.length;
    }
    if (score > 0) scored.push({ theme, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const themes = scored.slice(0, 3).map((entry) => entry.theme);
  return themes.length > 0 ? themes : FALLBACK_THEMES;
}

function countByType(items: AiReflectionUserMedia[]): {
  books: number;
  movies: number;
  music: number;
} {
  return {
    books: items.filter((item) => /book/i.test(item.type)).length,
    movies: items.filter((item) => /movie|film|tv/i.test(item.type)).length,
    music: items.filter((item) => /music|album|listen/i.test(item.type)).length,
  };
}

function buildReflectionText(
  themes: string[],
  media: AiReflectionUserMedia[],
  journalEntries: AiReflectionJournalEntry[],
  activities: AiReflectionActivity[],
  variation = 0,
): string {
  const [a, b, c] = [
    themes[0] ?? FALLBACK_THEMES[0],
    themes[1] ?? FALLBACK_THEMES[1],
    themes[2] ?? FALLBACK_THEMES[2],
  ];

  const { books, movies, music } = countByType(media);
  const recentTitle =
    journalEntries[0]?.title ?? media[0]?.title ?? activities[0]?.label;

  const variants = [
    `Your recent journey shows a preference for ${a}, ${b}, and ${c}.`,
    `Lately you return to ${a} — with room for ${b} and ${c}.`,
    `There is a quiet pattern in what you keep: ${a}, ${b}, and ${c}.`,
    `Your archive leans toward ${a}, softened by ${b} and ${c}.`,
  ];

  const text = variants[variation % variants.length] ?? variants[0];

  if (media.length === 0 && journalEntries.length === 0) {
    return text;
  }

  if (recentTitle && journalEntries.length > 0 && variation % 2 === 0) {
    return `${text} Moments around “${recentTitle}” suggest you linger with works that feel intimate and unhurried.`;
  }

  if (books >= movies && books >= music && variation % 3 === 1) {
    return `${text} Books are quietly leading the season — patient stories that leave room to feel.`;
  }

  if (music >= movies && music >= books && variation % 3 === 2) {
    return `${text} Sound is shaping your mood — nostalgic textures and soft emotional undercurrents.`;
  }

  return text;
}

/**
 * Mock Muse AI reflection generator.
 * Swap this implementation for a real model call later without changing UI props.
 */
export function generateMockAiReflection(
  input: AiReflectionInput,
  options?: { variation?: number },
): AiReflectionResult {
  const themes = extractThemes(collectBlob(input));
  const text = buildReflectionText(
    themes,
    input.userMedia,
    input.journalEntries,
    input.recentActivities,
    options?.variation ?? 0,
  );

  return {
    text,
    themes,
    source: "mock",
  };
}

/** Async facade matching a future AI client signature */
export async function requestAiReflection(
  input: AiReflectionInput,
  options?: { delayMs?: number; variation?: number },
): Promise<AiReflectionResult> {
  const delayMs = options?.delayMs ?? 480;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return generateMockAiReflection(input, { variation: options?.variation });
}
