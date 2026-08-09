"use client";

/**
 * Replace Explore editorial / CONTENT_CATALOG seed works with API-backed Works
 * whenever a real provider match exists.
 *
 * Provider routing:
 *   book  → Open Library
 *   film  → TMDB
 *   music → Last.fm
 */

import { CONTENT_CATALOG } from "@/lib/content/content-data";
import {
  EXPLORE_DISCOVERY_ITEMS,
  type DiscoveryCategory,
  type ExploreDiscoveryItem,
} from "@/lib/content/explore-discovery";
import {
  isRemoteCoverUrl,
  resolveCoverUrl,
} from "@/lib/work/cover-url";
import { isApiBackedSource } from "@/lib/work/content-layers";
import {
  findImportedWorkByIdentity,
  findImportedWorkByTitle,
  getImportedWorkById,
  persistImportedWork,
} from "@/lib/work/imported-work-catalog";
import {
  normalizeIdentityText,
  workIdentityKey,
  workTitleIdentityKey,
} from "@/lib/work/work-identity";
import type { Work, WorkType } from "@/types/work";

export type ExploreSeedRef = {
  /** Stable seed key (discovery id or catalog id). */
  seedId: string;
  title: string;
  creator: string;
  category: DiscoveryCategory;
  type: WorkType;
  cover: string;
  contentId?: string;
};

async function fetchProviderSearchWorks(
  path: "/api/books/search" | "/api/movies/search" | "/api/music/search",
  query: string,
  limit = 8,
): Promise<Work[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });
  try {
    const response = await fetch(`${path}?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: Work[] };
    return Array.isArray(payload.items) ? payload.items : [];
  } catch {
    return [];
  }
}

function categoryToWorkType(category: DiscoveryCategory): WorkType {
  if (category === "film") return "movie";
  if (category === "music") return "music";
  return "book";
}

function hasRealCover(cover: string | undefined | null): boolean {
  return isRemoteCoverUrl(cover);
}

/** Collect editorial + CONTENT_CATALOG seeds that still lack a remote cover. */
export function collectUnresolvedExploreSeeds(): ExploreSeedRef[] {
  const byKey = new Map<string, ExploreSeedRef>();

  const add = (seed: ExploreSeedRef) => {
    if (hasRealCover(seed.cover)) return;
    const key = `${seed.type}:${workTitleIdentityKey(seed.title)}`;
    if (!byKey.has(key)) byKey.set(key, seed);
  };

  for (const item of EXPLORE_DISCOVERY_ITEMS) {
    add({
      seedId: item.id,
      title: item.title,
      creator: item.creator,
      category: item.category,
      type: categoryToWorkType(item.category),
      cover: item.coverUrl?.trim() || item.cover,
      contentId: item.contentId,
    });
  }

  for (const content of CONTENT_CATALOG) {
    const category: DiscoveryCategory =
      content.type === "MOVIE"
        ? "film"
        : content.type === "MUSIC"
          ? "music"
          : "book";
    add({
      seedId: content.id,
      title: content.title,
      creator: content.creator,
      category,
      type: categoryToWorkType(category),
      cover: content.cover,
      contentId: content.id,
    });
  }

  return Array.from(byKey.values());
}

function alreadyResolvedApiWork(seed: ExploreSeedRef): Work | null {
  const imported =
    (seed.contentId ? getImportedWorkById(seed.contentId) : null) ??
    findImportedWorkByIdentity(seed.title, seed.creator) ??
    findImportedWorkByTitle(seed.title);

  if (!imported || !isApiBackedSource(imported.source)) return null;
  if (seed.type && imported.type !== seed.type) return null;
  if (!hasRealCover(imported.coverUrl)) return null;
  return imported;
}

/**
 * Score a candidate against a seed.
 * Prefer exact normalized title; creator/director/artist is secondary.
 * Tolerates translated creator names via title-only bonus.
 */
export function scoreSeedCandidate(seed: ExploreSeedRef, candidate: Work): number {
  if (candidate.type !== seed.type) return -1;
  if (!isApiBackedSource(candidate.source)) return -1;

  const seedTitle = workTitleIdentityKey(seed.title);
  const candidateTitle = workTitleIdentityKey(candidate.title);
  if (!seedTitle || !candidateTitle) return -1;

  let score = 0;

  if (candidateTitle === seedTitle) {
    score += 100;
  } else if (
    candidateTitle.includes(seedTitle) ||
    seedTitle.includes(candidateTitle)
  ) {
    score += 55;
  } else {
    return -1;
  }

  const seedCreator = normalizeIdentityText(seed.creator);
  const candidateCreator = normalizeIdentityText(candidate.creator);
  if (seedCreator && candidateCreator) {
    if (seedCreator === candidateCreator) {
      score += 40;
    } else if (
      candidateCreator.includes(seedCreator) ||
      seedCreator.includes(candidateCreator)
    ) {
      score += 20;
    }
    // Translated creators: no penalty — title match already scored.
  }

  if (hasRealCover(candidate.coverUrl)) score += 35;
  if (workIdentityKey(seed.title, seed.creator) ===
    workIdentityKey(candidate.title, candidate.creator)) {
    score += 15;
  }

  return score;
}

function pickBestSeedMatch(
  seed: ExploreSeedRef,
  candidates: Work[],
): Work | null {
  let best: Work | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = scoreSeedCandidate(seed, candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  // Require at least exact/near title + remote cover preference path.
  if (!best || bestScore < 55) return null;
  if (!hasRealCover(best.coverUrl)) return null;
  return best;
}

async function searchProviderForSeed(seed: ExploreSeedRef): Promise<Work[]> {
  const query = [seed.title, seed.creator].filter(Boolean).join(" ").trim();
  const titleOnly = seed.title.trim();
  if (!titleOnly) return [];

  const path =
    seed.category === "film" || seed.type === "movie"
      ? "/api/movies/search"
      : seed.category === "music" || seed.type === "music"
        ? "/api/music/search"
        : "/api/books/search";

  const [withCreator, byTitle] = await Promise.all([
    query ? fetchProviderSearchWorks(path, query, 8) : Promise.resolve([]),
    fetchProviderSearchWorks(path, titleOnly, 8),
  ]);
  return [...withCreator, ...byTitle];
}

/**
 * Resolve unresolved Explore seeds via the correct provider, persist API Works,
 * and return the successfully resolved Works.
 */
export async function enrichExploreSeedsFromApis(): Promise<Work[]> {
  const seeds = collectUnresolvedExploreSeeds();
  if (seeds.length === 0) return [];

  const resolved: Work[] = [];

  // Resolve sequentially in small batches to avoid stampedes.
  const concurrency = 3;
  for (let i = 0; i < seeds.length; i += concurrency) {
    const batch = seeds.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (seed) => {
        const existing = alreadyResolvedApiWork(seed);
        if (existing) return existing;

        const candidates = await searchProviderForSeed(seed);
        const best = pickBestSeedMatch(seed, candidates);
        if (!best) return null;

        // Never persist a gradient over a real cover — createImportedWork already
        // normalizes; persistImportedWork keeps prior remotes.
        return persistImportedWork(best);
      }),
    );

    for (const work of batchResults) {
      if (work && hasRealCover(work.coverUrl)) {
        resolved.push(work);
      }
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const verify = [
      "Kafka on the Shore",
      "Perfect Days",
      "Before Sunrise",
    ] as const;
    for (const title of verify) {
      const work =
        findImportedWorkByTitle(title) ??
        resolved.find(
          (item) => workTitleIdentityKey(item.title) === workTitleIdentityKey(title),
        );
      // eslint-disable-next-line no-console
      console.info("[explore-seed-enrich]", {
        title,
        resolvedWorkId: work?.id ?? null,
        source: work?.source ?? null,
        coverUrl: work ? resolveCoverUrl(work.coverUrl) : null,
      });
    }
  }

  return resolved;
}

/** Apply API Work fields onto a discovery seed item without clobbering remotes. */
export function replaceDiscoveryItemWithWork(
  item: ExploreDiscoveryItem,
  work: Work | null | undefined,
): ExploreDiscoveryItem {
  if (!work || !isApiBackedSource(work.source)) {
    return item;
  }

  const nextCover = resolveCoverUrl(work.coverUrl, item.coverUrl, item.cover);
  // Never overwrite a real API cover with a gradient/mock.
  const coverUrl = hasRealCover(work.coverUrl)
    ? resolveCoverUrl(work.coverUrl)
    : nextCover;

  return {
    ...item,
    title: work.title || item.title,
    creator: work.creator || item.creator,
    cover: coverUrl,
    coverUrl,
    contentId: work.id,
    source: "catalog",
    workSource: work.source,
    reason: work.description.trim() || item.reason,
  };
}
