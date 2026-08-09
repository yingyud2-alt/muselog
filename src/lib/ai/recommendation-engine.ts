import type { Content, ContentType } from "@/lib/content/types";
import { workToExploreContent } from "@/lib/explore/explore-content-provider";
import { filterDisplayableApiWorks } from "@/lib/work/displayable-api-work";
import { listImportedWorks } from "@/lib/work/imported-work-catalog";

function getRecommendationCatalog(): Content[] {
  return filterDisplayableApiWorks(listImportedWorks()).map((work) =>
    workToExploreContent(work),
  );
}

export type RecommendationMedia = {
  mediaKey?: string;
  title: string;
  type: string;
  status?: string;
  rating?: number;
  tags?: string[];
  shortReview?: string;
  notes?: string;
};

export type RecommendationJournalEntry = {
  title: string;
  type: string;
  note?: string;
  quote?: string;
  tags?: string[];
  rating?: number;
};

export type RecommendationInput = {
  userMedia: RecommendationMedia[];
  journalEntries: RecommendationJournalEntry[];
  /** Explicit taste tags (Cultural DNA / mood labels) */
  tags?: string[];
  /** Soft mood signals */
  mood?: string[];
};

export type Recommendation = {
  id: string;
  title: string;
  creator: string;
  type: ContentType;
  cover: string;
  reason: string;
  tags: string[];
  /** Anchor work that inspired the pick */
  becauseOf?: string;
  score: number;
};

const TASTE_SIGNAL_TAGS = [
  "quiet",
  "nostalgic",
  "reflective",
  "melancholy",
  "gentle",
  "calm",
  "longing",
  "bittersweet",
  "dreamlike",
  "warm",
  "curious",
] as const;

function normalizeType(type: string): ContentType | null {
  const upper = type.toUpperCase();
  if (upper === "BOOK" || upper === "MOVIE" || upper === "MUSIC") return upper;
  if (type === "book") return "BOOK";
  if (type === "movie") return "MOVIE";
  if (type === "music") return "MUSIC";
  return null;
}

function collectOwnedKeys(input: RecommendationInput): Set<string> {
  const owned = new Set<string>();

  for (const item of input.userMedia) {
    if (item.mediaKey) owned.add(item.mediaKey);
    owned.add(item.title.toLowerCase());
  }

  for (const entry of input.journalEntries) {
    owned.add(entry.title.toLowerCase());
  }

  return owned;
}

function isOwned(content: Content, owned: Set<string>): boolean {
  return owned.has(content.id) || owned.has(content.title.toLowerCase());
}

function extractPreferredTags(input: RecommendationInput): Map<string, number> {
  const weights = new Map<string, number>();

  const bump = (tag: string, amount: number) => {
    const key = tag.toLowerCase();
    weights.set(key, (weights.get(key) ?? 0) + amount);
  };

  for (const tag of input.tags ?? []) bump(tag, 3);
  for (const mood of input.mood ?? []) bump(mood, 2);

  for (const item of input.userMedia) {
    const ratingBoost = (item.rating ?? 0) >= 4 ? 2 : 1;
    for (const tag of item.tags ?? []) bump(tag, ratingBoost);

    const text = `${item.shortReview ?? ""} ${item.notes ?? ""}`.toLowerCase();
    for (const signal of TASTE_SIGNAL_TAGS) {
      if (text.includes(signal)) bump(signal, ratingBoost);
    }
  }

  for (const entry of input.journalEntries) {
    for (const tag of entry.tags ?? []) bump(tag, 2);
    const text = `${entry.note ?? ""} ${entry.quote ?? ""}`.toLowerCase();
    for (const signal of TASTE_SIGNAL_TAGS) {
      if (text.includes(signal)) bump(signal, 1);
    }
  }

  if (weights.size === 0) {
    for (const fallback of ["quiet", "nostalgic", "reflective"]) {
      bump(fallback, 1);
    }
  }

  return weights;
}

function extractPreferredTypes(input: RecommendationInput): Map<ContentType, number> {
  const counts = new Map<ContentType, number>();

  const bump = (type: string, amount: number) => {
    const normalized = normalizeType(type);
    if (!normalized) return;
    counts.set(normalized, (counts.get(normalized) ?? 0) + amount);
  };

  for (const item of input.userMedia) {
    const amount = (item.rating ?? 0) >= 4 ? 3 : item.status === "FINISHED" ? 2 : 1;
    bump(item.type, amount);
  }

  for (const entry of input.journalEntries) {
    bump(entry.type, 2);
  }

  return counts;
}

function findAnchorTitle(
  content: Content,
  input: RecommendationInput,
  sharedTags: string[],
): string | undefined {
  const candidates = [
    ...input.userMedia
      .filter((item) => (item.rating ?? 0) >= 4 || item.status === "FINISHED")
      .map((item) => ({
        title: item.title,
        tags: item.tags ?? [],
        score: item.rating ?? 3,
      })),
    ...input.journalEntries.map((entry) => ({
      title: entry.title,
      tags: entry.tags ?? [],
      score: entry.rating ?? 3,
    })),
  ];

  let best: { title: string; score: number } | null = null;

  for (const candidate of candidates) {
    const overlap = candidate.tags.filter((tag) =>
      sharedTags.includes(tag.toLowerCase()),
    ).length;
    const score = overlap * 10 + candidate.score;
    if (!best || score > best.score) {
      best = { title: candidate.title, score };
    }
  }

  if (best && best.score >= 3) return best.title;

  // Same creator as a liked work
  const sameCreator = candidates.find((candidate) =>
    input.userMedia.some(
      (item) =>
        item.title === candidate.title &&
        content.creator.trim().length > 0,
    ),
  );

  return sameCreator?.title ?? candidates[0]?.title;
}

function buildReason(content: Content, becauseOf?: string, sharedTags: string[] = []): string {
  if (becauseOf) {
    return `Because you liked ${becauseOf}`;
  }

  if (sharedTags.length > 0) {
    return `Because you lean toward ${sharedTags.slice(0, 2).join(" & ")} works`;
  }

  return `A quiet match for your ${content.type.toLowerCase()} taste`;
}

function scoreContent(
  content: Content,
  preferredTags: Map<string, number>,
  preferredTypes: Map<ContentType, number>,
): { score: number; sharedTags: string[] } {
  let score = 0;
  const sharedTags: string[] = [];

  for (const tag of content.tags) {
    const weight = preferredTags.get(tag.toLowerCase()) ?? 0;
    if (weight > 0) {
      score += weight * 4;
      sharedTags.push(tag.toLowerCase());
    }
  }

  const typeWeight = preferredTypes.get(content.type) ?? 0;
  score += typeWeight * 3;

  // Soft boost for overlapping taste family
  if (sharedTags.some((tag) => ["quiet", "nostalgic", "reflective"].includes(tag))) {
    score += 2;
  }

  return { score, sharedTags };
}

/**
 * Rule-based Muse AI recommendation engine.
 * Replace the body of this function with a model call later —
 * keep the RecommendationInput / Recommendation contract stable.
 */
export function generateRecommendations(
  input: RecommendationInput,
  options?: { limit?: number },
): Recommendation[] {
  const limit = options?.limit ?? 6;
  const owned = collectOwnedKeys(input);
  const preferredTags = extractPreferredTags(input);
  const preferredTypes = extractPreferredTypes(input);

  const catalog = getRecommendationCatalog();
  const ranked = catalog
    .filter((content) => !isOwned(content, owned))
    .map((content) => {
      const { score, sharedTags } = scoreContent(
        content,
        preferredTags,
        preferredTypes,
      );
      const becauseOf = findAnchorTitle(content, input, sharedTags);

      return {
        id: content.id,
        title: content.title,
        creator: content.creator,
        type: content.type,
        cover: content.cover,
        tags: content.tags,
        becauseOf,
        reason: buildReason(content, becauseOf, sharedTags),
        score,
      } satisfies Recommendation;
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.title.localeCompare(right.title);
    });

  if (ranked.length > 0) {
    return ranked.slice(0, limit);
  }

  // Soft fallback from displayable API catalog only — never mock CONTENT_CATALOG.
  return catalog.slice(0, limit).map((content, index) => ({
    id: content.id,
    title: content.title,
    creator: content.creator,
    type: content.type,
    cover: content.cover,
    tags: content.tags,
    becauseOf: "your quiet archive",
    reason: "From the public API catalog",
    score: limit - index,
  }));
}

/** Pick one curated surprise from the recommendation pool */
export function pickSurpriseRecommendation(
  input: RecommendationInput,
  excludeId?: string,
): Recommendation {
  const pool = generateRecommendations(input, { limit: 8 }).filter(
    (item) => item.id !== excludeId,
  );

  if (pool.length === 0) {
    const catalog = getRecommendationCatalog();
    const fallback =
      catalog.find((entry) => entry.id !== excludeId) ?? catalog[0];
    if (!fallback) {
      return {
        id: "empty",
        title: "Nothing to suggest yet",
        creator: "MuseLog",
        type: "BOOK",
        cover: "",
        tags: [],
        reason: "Explore API-backed works to unlock picks",
        score: 0,
      };
    }
    return {
      id: fallback.id,
      title: fallback.title,
      creator: fallback.creator,
      type: fallback.type,
      cover: fallback.cover,
      tags: fallback.tags,
      reason: "A quiet discovery from the public catalog",
      score: 1,
    };
  }

  // Weight toward higher scores while keeping a little surprise
  const top = pool.slice(0, Math.min(5, pool.length));
  const index = Math.floor(Math.random() * top.length);
  return top[index] ?? top[0];
}

export function buildRecommendationInputFromLibrary(
  items: Array<{
    mediaKey: string;
    title: string;
    type: string;
    status?: string;
    rating?: number;
    shortReview?: string;
    notes?: string;
  }>,
  journalEntries: RecommendationJournalEntry[],
  tags: string[] = [],
  mood: string[] = [],
  contentTagsByKey: Record<string, string[]> = {},
): RecommendationInput {
  return {
    userMedia: items.map((item) => ({
      mediaKey: item.mediaKey,
      title: item.title,
      type: item.type,
      status: item.status,
      rating: item.rating,
      shortReview: item.shortReview,
      notes: item.notes,
      tags: contentTagsByKey[item.mediaKey] ?? [],
    })),
    journalEntries,
    tags,
    mood,
  };
}
