/**
 * Deterministic metadata-based mood recommender for Homepage Mood Bubbles.
 * Uses the canonical API-backed Work catalog (same as Explore).
 *
 * Future LLM hooks (not implemented this phase):
 * - parseMoodIntentWithLLM()
 * - generateRecommendationReason()
 */

import { isDisplayableApiWork } from "@/lib/work/displayable-api-work";
import type { Work, WorkType } from "@/types/work";

import {
  MOOD_TAXONOMY,
  resolveRecommendationMood,
  type RecommendationMood,
} from "@/lib/recommendation/mood-taxonomy";

export type RecommendWorksByMoodInput = {
  mood: string;
  works: Work[];
  limit: number;
  seed?: number | string;
};

export type ScoredMoodRecommendation = {
  work: Work;
  score: number;
};

export type MoodRecommendationBatch = {
  mood: RecommendationMood;
  items: ScoredMoodRecommendation[];
  candidateCount: number;
};

/** Future: parse free-text mood into RecommendationMood via LLM. */
export async function parseMoodIntentWithLLM(
  _text: string,
): Promise<RecommendationMood | null> {
  return null;
}

/** Future: LLM reason string grounded in Work metadata. */
export async function generateRecommendationReason(
  _work: Work,
  _mood: RecommendationMood,
): Promise<string | null> {
  return null;
}

function hashSeed(input: number | string): number {
  const text = String(input);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Deterministic [0, 1) from seed + salt. */
function seededUnit(seed: number, salt: string): number {
  return (hashSeed(`${seed}:${salt}`) % 10_000) / 10_000;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function collectHaystack(work: Work): string {
  return [
    work.title,
    work.creator,
    work.description,
    ...work.genres,
    ...work.moodTags,
  ]
    .join(" ")
    .toLowerCase();
}

function countSignalHits(haystack: string, signals: string[]): number {
  let hits = 0;
  for (const signal of signals) {
    const token = normalize(signal);
    if (!token) continue;
    if (haystack.includes(token)) hits += 1;
  }
  return hits;
}

function ratingConfidence(work: Work): number {
  const rating = work.externalRatings?.[0];
  if (!rating || !Number.isFinite(rating.value) || rating.scale <= 0) {
    return 0;
  }
  const normalized = Math.max(0, Math.min(1, rating.value / rating.scale));
  const countBoost =
    typeof rating.count === "number" && rating.count > 0
      ? Math.min(0.15, Math.log10(rating.count + 1) / 20)
      : 0;
  return normalized * 0.35 + countBoost;
}

function scoreWorkForMood(
  work: Work,
  mood: RecommendationMood,
  seed: number,
): number {
  const taxonomy = MOOD_TAXONOMY[mood];
  const haystack = collectHaystack(work);
  const genreHits = countSignalHits(
    work.genres.join(" ").toLowerCase(),
    taxonomy.genres,
  );
  const tagHits = countSignalHits(
    [...work.moodTags, ...work.genres].join(" ").toLowerCase(),
    taxonomy.tags,
  );
  const subjectHits = countSignalHits(haystack, taxonomy.subjects);
  const keywordHits = countSignalHits(work.description.toLowerCase(), taxonomy.keywords);

  let score =
    genreHits * 4.2 +
    tagHits * 3.4 +
    subjectHits * 2.8 +
    keywordHits * 2.2 +
    1.5; // base for valid cover (already filtered)

  score += ratingConfidence(work);

  const mediaBoost = taxonomy.mediaPreference?.[work.type] ?? 1;
  score *= mediaBoost;

  // Controlled jitter so near-tied items can reshuffle with a new seed.
  score += seededUnit(seed, work.id) * 1.35;

  return score;
}

function typeQuotaTarget(limit: number, type: WorkType): number {
  // Soft diversity: aim for roughly even book/movie/music mix.
  const base = Math.floor(limit / 3);
  if (type === "book") return base + (limit % 3 > 0 ? 1 : 0);
  if (type === "movie") return base + (limit % 3 > 1 ? 1 : 0);
  return base;
}

/**
 * Recommend real Works for a mood from the canonical API catalog.
 * Deterministic for a given seed; pass a new seed to reshuffle.
 */
export function recommendWorksByMood(
  input: RecommendWorksByMoodInput,
): Work[] {
  return recommendWorksByMoodDetailed(input).items.map((item) => item.work);
}

export function recommendWorksByMoodDetailed(
  input: RecommendWorksByMoodInput,
): MoodRecommendationBatch {
  const mood = resolveRecommendationMood(input.mood);
  const seed = hashSeed(input.seed ?? `${mood}:default`);
  const limit = Math.max(0, Math.floor(input.limit));

  const candidates = input.works.filter(
    (work) =>
      isDisplayableApiWork(work) &&
      (work.type === "book" || work.type === "movie" || work.type === "music"),
  );

  const scored = candidates
    .map((work) => ({
      work,
      score: scoreWorkForMood(work, mood, seed),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.work.id.localeCompare(right.work.id);
    });

  const selected: ScoredMoodRecommendation[] = [];
  const usedIds = new Set<string>();
  const usedCreators = new Set<string>();
  const typeCounts: Record<WorkType, number> = {
    book: 0,
    movie: 0,
    music: 0,
  };

  const tryPick = (item: ScoredMoodRecommendation, enforceDiversity: boolean) => {
    if (selected.length >= limit) return false;
    if (usedIds.has(item.work.id)) return false;

    const creatorKey = normalize(item.work.creator);
    if (enforceDiversity && creatorKey && usedCreators.has(creatorKey)) {
      return false;
    }

    const type = item.work.type;
    if (
      enforceDiversity &&
      typeCounts[type] >= typeQuotaTarget(limit, type) &&
      selected.length < limit - 1
    ) {
      // Leave room for under-represented types when possible.
      const underfilled = (["book", "movie", "music"] as WorkType[]).some(
        (candidate) =>
          typeCounts[candidate] < typeQuotaTarget(limit, candidate) &&
          scored.some(
            (row) =>
              row.work.type === candidate && !usedIds.has(row.work.id),
          ),
      );
      if (underfilled && typeCounts[type] > 0) return false;
    }

    selected.push(item);
    usedIds.add(item.work.id);
    if (creatorKey) usedCreators.add(creatorKey);
    typeCounts[type] += 1;
    return true;
  };

  for (const item of scored) {
    tryPick(item, true);
    if (selected.length >= limit) break;
  }

  // Fill remaining slots without strict diversity if the pool is thin.
  if (selected.length < limit) {
    for (const item of scored) {
      tryPick(item, false);
      if (selected.length >= limit) break;
    }
  }

  if (
    typeof window !== "undefined" &&
    process.env.NODE_ENV !== "production"
  ) {
    // eslint-disable-next-line no-console
    console.info("[mood-bubbles:recommendation]", {
      mood,
      candidateCount: candidates.length,
      selectedIds: selected.map((item) => item.work.id),
      selectedTypes: selected.map((item) => item.work.type),
      sources: selected.map((item) => item.work.source),
      scores: selected.map((item) => Math.round(item.score * 100) / 100),
    });
  }

  return {
    mood,
    items: selected,
    candidateCount: candidates.length,
  };
}
