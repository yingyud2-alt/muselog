"use client";

/**
 * Unified Explore content provider — API-only public catalog.
 *
 * Priority:
 *   1. Open Library books + TMDB movies + Last.fm music
 *   2. imported-work-catalog (API-backed only)
 *
 * Live surfaces never include CONTENT_CATALOG / editorial mock seeds.
 * Persists discovery into imported-work-catalog (public cache only —
 * never writes user-media-state / Library).
 */

import { getContentById } from "@/lib/content/content-data";
import type { ExploreMood } from "@/lib/content/constants";
import { CURATED_LIST_DEFINITIONS } from "@/lib/content/curated-lists";
import {
  DISCOVERY_MODULE_COPY,
  type DiscoveryCategory,
  type DiscoveryModule,
  type ExploreDiscoveryItem,
} from "@/lib/content/explore-discovery";
import type {
  Content,
  ContentSource,
  CuratedList,
} from "@/lib/content/types";
import { replaceDiscoveryItemWithWork } from "@/lib/explore/enrich-explore-seeds";
import {
  isRemoteCoverUrl,
  normalizeWorkCoverUrl,
  resolveCoverUrl,
} from "@/lib/work/cover-url";
import { cleanDescription } from "@/lib/work/clean-description";
import { isApiBackedSource } from "@/lib/work/content-layers";
import {
  filterDisplayableApiWorks,
  isDisplayableApiWork,
} from "@/lib/work/displayable-api-work";
import {
  findImportedWorkByIdentity,
  findImportedWorkByTitle,
  getImportedWorkById,
  listImportedWorks,
  persistImportedWork,
} from "@/lib/work/imported-work-catalog";
import { toContentType } from "@/lib/work/work-adapters";
import {
  workIdentityKey,
  workTitleIdentityKey,
} from "@/lib/work/work-identity";
import type { ExternalRating, Work, WorkType } from "@/types/work";

/** Book subjects fetched to expand Explore coverage (≥20 displayable). */
const BOOK_EXPAND_CATEGORIES = [
  "classics",
  "contemporary fiction",
  "literary fiction",
  "literature",
  "romance",
  "mystery",
  "memoir",
  "philosophy",
] as const;

/** TMDB genres / modes for Explore movie coverage. */
const MOVIE_EXPAND_CATEGORIES = [
  "drama",
  "romance",
  "science fiction",
  "documentary",
] as const;

/** Last.fm tags for Explore music coverage. */
const MUSIC_EXPAND_TAGS = [
  "alternative",
  "pop",
  "indie",
  "jazz",
  "electronic",
] as const;

/** Canonical Explore card payload — always prefer coverUrl over gradients. */
export type ExploreContentItem = {
  id: string;
  title: string;
  creator: string;
  coverUrl: string;
  description: string;
  source: string;
  type?: Content["type"];
  tags?: string[];
  externalRatings?: ExternalRating[];
  externalId?: string;
};

export type ExploreCatalogMode = "api" | "fallback" | "loading";

export type ExploreMovieSections = {
  /** Sorted by releaseDate descending when available. */
  recent: Work[];
};

export type ExploreMusicSections = {
  /** Bootstrap / newly surfaced Last.fm works. */
  recent: Work[];
};

export type ExploreApiFeed = {
  /** Open Library book discovery (unchanged). */
  trending: Work[];
  popular: Work[];
  byMood: Record<ExploreMood, Work[]>;
  byCuratedCategory: Record<string, Work[]>;
  /** TMDB movie discovery. */
  trendingMovies: Work[];
  popularMovies: Work[];
  movieSections: ExploreMovieSections;
  /** Last.fm music discovery. */
  trendingMusic: Work[];
  popularMusic: Work[];
  musicSections: ExploreMusicSections;
};

export type ExploreDiscoverySection = {
  module: DiscoveryModule;
  title: string;
  description: string;
  items: ExploreDiscoveryItem[];
};

const MOOD_CATEGORIES: Record<ExploreMood, string> = {
  quiet: "literary fiction",
  nostalgic: "coming of age",
  curious: "science fiction",
};

const COMMUNITY_BOOK_CATEGORY = "philosophy";

let feedPromise: Promise<ExploreApiFeed | null> | null = null;
let feedCache: ExploreApiFeed | null | undefined;

function mapWorkSource(source: string | undefined): ContentSource {
  const value = (source ?? "").toLowerCase();
  if (value === "open_library") return "open_library";
  if (value === "google_books") return "google_books";
  if (value === "tmdb") return "tmdb";
  if (value === "spotify") return "spotify";
  if (value === "lastfm") return "spotify"; // ContentSource has no lastfm yet
  if (value === "douban") return "douban";
  return "manual";
}

function workQualityScore(work: Work): number {
  let score = 0;
  if (work.source === "open_library") score += 50;
  else if (work.source && work.source !== "manual") score += 40;
  if (isRemoteCoverUrl(work.coverUrl)) score += 40;
  if (work.description.trim()) score += 10;
  if (work.externalRatings && work.externalRatings.length > 0) score += 5;
  return score;
}

/** Prefer richer API Work; never drop remote coverUrl / description / ratings. */
export function preferApiWork(candidate: Work, existing?: Work): Work {
  if (!existing) return candidate;
  const winner =
    workQualityScore(candidate) >= workQualityScore(existing)
      ? candidate
      : existing;
  const loser = winner === candidate ? existing : candidate;

  return {
    ...loser,
    ...winner,
    coverUrl: resolveCoverUrl(winner.coverUrl, loser.coverUrl),
    description: winner.description.trim()
      ? winner.description
      : loser.description,
    externalRatings:
      winner.externalRatings && winner.externalRatings.length > 0
        ? winner.externalRatings
        : loser.externalRatings,
    externalId: winner.externalId ?? loser.externalId,
    source: winner.source ?? loser.source,
    genres:
      winner.genres.length > 0 ? winner.genres : loser.genres,
    metadata: {
      ...(loser.metadata ?? {}),
      ...(winner.metadata ?? {}),
    },
  };
}

/** Merge Works by title + type identity (handles EN/JA author mismatch). */
export function mergeWorksByTitleIdentity(works: Work[]): Work[] {
  const byTitle = new Map<string, Work>();

  for (const work of works) {
    const titleKey =
      workTitleIdentityKey(work.title) ||
      workIdentityKey(work.title, work.creator) ||
      work.id;
    const key = `${work.type}:${titleKey}`;
    byTitle.set(key, preferApiWork(work, byTitle.get(key)));
  }

  return Array.from(byTitle.values());
}

/** Dedupe by provider id first, then title + type. */
export function dedupeWorks(works: Work[]): Work[] {
  const byProvider = new Map<string, Work>();
  const withoutProvider: Work[] = [];

  for (const work of works) {
    const source = work.source?.trim().toLowerCase() ?? "";
    const externalId = work.externalId?.trim().toLowerCase() ?? "";
    if (source && externalId) {
      const key = `${source}:${externalId}`;
      byProvider.set(key, preferApiWork(work, byProvider.get(key)));
    } else {
      withoutProvider.push(work);
    }
  }

  return mergeWorksByTitleIdentity([
    ...Array.from(byProvider.values()),
    ...withoutProvider,
  ]);
}

function onlyDisplayable(works: Work[]): Work[] {
  return filterDisplayableApiWorks(dedupeWorks(works));
}

/** Work → Explore card contract (normalized coverUrl always present). */
export function workToExploreContentItem(
  work: Work,
  extraTags: string[] = [],
): ExploreContentItem {
  const baseTags =
    work.moodTags.length > 0
      ? work.moodTags
      : work.genres.length > 0
        ? work.genres.slice(0, 8)
        : [];
  const tags = Array.from(
    new Set(
      [...baseTags, ...extraTags]
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  const coverUrl = normalizeWorkCoverUrl(work.coverUrl, {
    source: work.source,
  });

  return {
    id: work.id,
    title: work.title,
    creator: work.creator,
    coverUrl,
    description: cleanDescription(work.description),
    source: work.source ?? "manual",
    type: toContentType(work.type),
    tags,
    externalRatings: work.externalRatings,
    externalId: work.externalId,
  };
}

/** ExploreContentItem → existing Content UI shape (cover mirrors coverUrl). */
export function exploreItemToContent(item: ExploreContentItem): Content {
  const coverUrl = normalizeWorkCoverUrl(item.coverUrl, {
    source: item.source,
  });
  return {
    id: item.id,
    type: item.type ?? "BOOK",
    title: item.title,
    creator: item.creator,
    cover: coverUrl,
    description: item.description,
    tags: item.tags ?? [],
    source: mapWorkSource(item.source),
  };
}

export function workToExploreContent(
  work: Work,
  extraTags: string[] = [],
): Content {
  return exploreItemToContent(workToExploreContentItem(work, extraTags));
}

async function fetchSearchWorks(query: string, limit = 8): Promise<Work[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });
  const response = await fetch(`/api/books/search?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: Work[] };
  return Array.isArray(payload.items) ? payload.items : [];
}

async function fetchDiscoverWorks(
  mode: "trending" | "popular" | "category" | "bootstrap",
  options: { category?: string; limit?: number } = {},
): Promise<Work[]> {
  const params = new URLSearchParams({
    mode,
    limit: String(options.limit ?? 24),
  });
  if (options.category) params.set("category", options.category);

  try {
    const response = await fetch(`/api/books/discover?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: Work[] };
    return Array.isArray(payload.items) ? payload.items : [];
  } catch {
    return [];
  }
}

/** TMDB movie search → Work[] (via /api/movies/search). */
export async function fetchMovieSearchWorks(
  query: string,
  limit = 8,
): Promise<Work[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });
  try {
    const response = await fetch(`/api/movies/search?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: Work[] };
    return Array.isArray(payload.items) ? payload.items : [];
  } catch {
    return [];
  }
}

/** TMDB movie discovery → Work[] (via /api/movies/discover). */
export async function fetchMovieDiscoverWorks(
  mode:
    | "trending"
    | "popular"
    | "category"
    | "bootstrap"
    | "top_rated"
    | "now_playing",
  options: { category?: string; limit?: number } = {},
): Promise<Work[]> {
  const params = new URLSearchParams({
    mode,
    limit: String(options.limit ?? 24),
  });
  if (options.category) params.set("category", options.category);

  try {
    const response = await fetch(`/api/movies/discover?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: Work[] };
    return Array.isArray(payload.items) ? payload.items : [];
  } catch {
    return [];
  }
}

/** Last.fm music search → Work[] (via /api/music/search). */
export async function fetchMusicSearchWorks(
  query: string,
  limit = 8,
): Promise<Work[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });
  try {
    const response = await fetch(`/api/music/search?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: Work[] };
    return Array.isArray(payload.items) ? payload.items : [];
  } catch {
    return [];
  }
}

/** Last.fm music discovery → Work[] (via /api/music/discover). */
export async function fetchMusicDiscoverWorks(
  mode: "trending" | "popular" | "bootstrap" | "category",
  options: { category?: string; limit?: number } = {},
): Promise<Work[]> {
  const params = new URLSearchParams({
    mode,
    limit: String(options.limit ?? 24),
  });
  if (options.category) params.set("category", options.category);

  try {
    const response = await fetch(`/api/music/discover?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: Work[] };
    return Array.isArray(payload.items) ? payload.items : [];
  } catch {
    return [];
  }
}

function sortMoviesByReleaseDateDesc(works: Work[]): Work[] {
  return [...works].sort((left, right) => {
    const leftDate = left.releaseDate?.trim() ?? "";
    const rightDate = right.releaseDate?.trim() ?? "";
    if (leftDate && rightDate) return rightDate.localeCompare(leftDate);
    if (rightDate) return 1;
    if (leftDate) return -1;
    return 0;
  });
}

/** Prefer higher Last.fm listener / playcount for “recently discovered” ordering. */
function sortMusicByPopularityDesc(works: Work[]): Work[] {
  return [...works].sort((left, right) => {
    const leftScore =
      (typeof left.metadata?.listeners === "number"
        ? left.metadata.listeners
        : 0) +
      (typeof left.metadata?.playcount === "number"
        ? left.metadata.playcount / 1000
        : 0);
    const rightScore =
      (typeof right.metadata?.listeners === "number"
        ? right.metadata.listeners
        : 0) +
      (typeof right.metadata?.playcount === "number"
        ? right.metadata.playcount / 1000
        : 0);
    return rightScore - leftScore;
  });
}

/** Persist public catalog Works only — never writes User Library status. */
export function persistPublicCatalogWorks(works: Work[]) {
  for (const work of works) {
    persistImportedWork(work);
  }
  // Rewrite legacy catalog workIds in Journal / Library once API Works land.
  if (typeof window !== "undefined" && works.length > 0) {
    void import("@/lib/work/migrate-canonical-work-ids").then(
      ({ migrateCanonicalWorkIds }) => {
        migrateCanonicalWorkIds();
      },
    );
  }
}

/**
 * Fetch Open Library + TMDB + Last.fm discovery; persist into imported-work-catalog.
 */
export async function loadExploreApiFeed(): Promise<ExploreApiFeed | null> {
  if (feedCache) return feedCache;
  if (feedPromise) return feedPromise;

  feedPromise = (async () => {
    try {
      const [
        norwegian,
        interstellar,
        blonde,
        bootstrap,
        trendingMoviesRaw,
        popularMoviesRaw,
        topRatedMoviesRaw,
        nowPlayingMoviesRaw,
        movieBootstrap,
        trendingMusicRaw,
        popularMusicRaw,
        musicBootstrap,
        bookCategoryBatches,
        movieCategoryBatches,
        musicTagBatches,
      ] = await Promise.all([
        fetchSearchWorks("Norwegian Wood", 5),
        fetchMovieSearchWorks("Interstellar", 4),
        fetchMusicSearchWorks("Blonde Frank Ocean", 4),
        fetchDiscoverWorks("bootstrap", { limit: 28 }),
        fetchMovieDiscoverWorks("trending", { limit: 24 }),
        fetchMovieDiscoverWorks("popular", { limit: 24 }),
        fetchMovieDiscoverWorks("top_rated", { limit: 20 }),
        fetchMovieDiscoverWorks("now_playing", { limit: 20 }),
        fetchMovieDiscoverWorks("bootstrap", { limit: 28 }),
        fetchMusicDiscoverWorks("trending", { limit: 24 }),
        fetchMusicDiscoverWorks("popular", { limit: 24 }),
        fetchMusicDiscoverWorks("bootstrap", { limit: 28 }),
        Promise.all(
          BOOK_EXPAND_CATEGORIES.map((category) =>
            fetchDiscoverWorks("category", { category, limit: 10 }),
          ),
        ),
        Promise.all(
          MOVIE_EXPAND_CATEGORIES.map((category) =>
            fetchMovieDiscoverWorks("category", { category, limit: 10 }),
          ),
        ),
        Promise.all(
          MUSIC_EXPAND_TAGS.map((category) =>
            fetchMusicDiscoverWorks("category", { category, limit: 10 }),
          ),
        ),
      ]);

      const expandedBooks = bookCategoryBatches.flat();
      const expandedMovies = movieCategoryBatches.flat();
      const expandedMusic = musicTagBatches.flat();

      const seed = onlyDisplayable([
        ...norwegian,
        ...bootstrap,
        ...expandedBooks,
      ]);

      if (seed.length > 0) {
        persistPublicCatalogWorks(seed);
      }

      const moviePool = onlyDisplayable([
        ...trendingMoviesRaw,
        ...popularMoviesRaw,
        ...topRatedMoviesRaw,
        ...nowPlayingMoviesRaw,
        ...movieBootstrap,
        ...interstellar,
        ...expandedMovies,
      ]);

      const trendingMovies = onlyDisplayable(
        trendingMoviesRaw.length > 0 ? trendingMoviesRaw : moviePool,
      );
      const popularMovies = onlyDisplayable(
        popularMoviesRaw.length > 0 ? popularMoviesRaw : moviePool,
      );
      const recentMovies = sortMoviesByReleaseDateDesc(
        onlyDisplayable([
          ...nowPlayingMoviesRaw,
          ...popularMovies,
          ...trendingMovies,
          ...movieBootstrap,
        ]),
      ).slice(0, 16);

      if (moviePool.length > 0) {
        persistPublicCatalogWorks(moviePool);
      }

      const movieFeed = {
        trendingMovies,
        popularMovies,
        movieSections: { recent: recentMovies },
      };

      const musicPool = onlyDisplayable([
        ...trendingMusicRaw,
        ...popularMusicRaw,
        ...musicBootstrap,
        ...blonde,
        ...expandedMusic,
      ]);

      const trendingMusic = onlyDisplayable(
        trendingMusicRaw.length > 0 ? trendingMusicRaw : musicPool,
      );
      const popularMusic = onlyDisplayable(
        popularMusicRaw.length > 0 ? popularMusicRaw : musicPool,
      );
      const recentMusic = sortMusicByPopularityDesc(musicPool).slice(0, 16);

      if (musicPool.length > 0) {
        persistPublicCatalogWorks(musicPool);
      }

      const musicFeed = {
        trendingMusic,
        popularMusic,
        musicSections: { recent: recentMusic },
      };

      const [trendingRaw, popularRaw] = await Promise.all([
        fetchDiscoverWorks("trending", { limit: 24 }),
        fetchDiscoverWorks("popular", { limit: 24 }),
      ]);

      let trending = onlyDisplayable(
        trendingRaw.length > 0 ? trendingRaw : seed,
      );
      let popular = onlyDisplayable(
        popularRaw.length > 0 ? popularRaw : seed,
      );

      if (trending.length === 0 && popular.length === 0 && seed.length > 0) {
        trending = seed;
        popular = seed;
      }

      const moodEntries = Object.entries(MOOD_CATEGORIES) as Array<
        [ExploreMood, string]
      >;
      const curatedCategories = CURATED_LIST_DEFINITIONS.map(
        (list) => list.apiCategory,
      );

      const moodWorks: Work[][] = [];
      for (const [, category] of moodEntries) {
        const works = onlyDisplayable(
          await fetchDiscoverWorks("category", {
            category,
            limit: 12,
          }),
        );
        moodWorks.push(works.length > 0 ? works : trending.slice(0, 12));
      }

      const curatedWorks: Work[][] = [];
      for (const category of curatedCategories) {
        const works = onlyDisplayable(
          await fetchDiscoverWorks("category", {
            category,
            limit: 10,
          }),
        );
        curatedWorks.push(works.length > 0 ? works : popular.slice(0, 8));
      }

      const communityRaw = onlyDisplayable(
        await fetchDiscoverWorks("category", {
          category: COMMUNITY_BOOK_CATEGORY,
          limit: 12,
        }),
      );
      const community =
        communityRaw.length > 0 ? communityRaw : popular.slice(0, 12);

      const byMood = {
        quiet: moodWorks[0] ?? trending.slice(0, 12),
        nostalgic: moodWorks[1] ?? popular.slice(0, 12),
        curious: moodWorks[2] ?? trending.slice(0, 12),
      } satisfies Record<ExploreMood, Work[]>;

      const byCuratedCategory: Record<string, Work[]> = {};
      curatedCategories.forEach((category, index) => {
        byCuratedCategory[category] = curatedWorks[index] ?? popular.slice(0, 8);
      });
      byCuratedCategory[COMMUNITY_BOOK_CATEGORY] = community;

      const allBooks = onlyDisplayable([
        ...seed,
        ...trending,
        ...popular,
        ...Object.values(byMood).flat(),
        ...Object.values(byCuratedCategory).flat(),
      ]);

      const hasMovies =
        movieFeed.trendingMovies.length > 0 ||
        movieFeed.popularMovies.length > 0 ||
        movieFeed.movieSections.recent.length > 0;
      const hasMusic =
        musicFeed.trendingMusic.length > 0 ||
        musicFeed.popularMusic.length > 0 ||
        musicFeed.musicSections.recent.length > 0;

      if (allBooks.length === 0 && !hasMovies && !hasMusic) {
        feedCache = null;
        return null;
      }

      if (allBooks.length > 0) {
        persistPublicCatalogWorks(allBooks);
      }

      const feed: ExploreApiFeed = {
        trending,
        popular,
        byMood,
        byCuratedCategory,
        trendingMovies: movieFeed.trendingMovies,
        popularMovies: movieFeed.popularMovies,
        movieSections: movieFeed.movieSections,
        trendingMusic: musicFeed.trendingMusic,
        popularMusic: musicFeed.popularMusic,
        musicSections: musicFeed.musicSections,
      };

      if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
        const counts = {
          book: allBooks.length,
          movie: moviePool.length,
          music: musicPool.length,
        };
        // eslint-disable-next-line no-console
        console.info("[explore:api-catalog]", counts);
      }

      feedCache = feed;
      return feed;
    } catch {
      feedCache = null;
      return null;
    } finally {
      feedPromise = null;
    }
  })();

  return feedPromise;
}

export function getExploreApiFeedCache(): ExploreApiFeed | null | undefined {
  return feedCache;
}

/** Merge discovery feed + imported catalog (books + movies + music). */
export function collectApiWorks(
  feed: ExploreApiFeed | null,
  imported: Work[] = listImportedWorks(),
): Work[] {
  const fromFeed = feed
    ? [
        ...feed.trending,
        ...feed.popular,
        ...Object.values(feed.byMood).flat(),
        ...Object.values(feed.byCuratedCategory).flat(),
        ...(feed.trendingMovies ?? []),
        ...(feed.popularMovies ?? []),
        ...(feed.movieSections?.recent ?? []),
        ...(feed.trendingMusic ?? []),
        ...(feed.popularMusic ?? []),
        ...(feed.musicSections?.recent ?? []),
      ]
    : [];

  return onlyDisplayable([
    ...fromFeed,
    ...imported.filter(
      (work) =>
        work.type === "book" ||
        work.type === "movie" ||
        work.type === "music",
    ),
  ]);
}

/**
 * Build Explore grid items — displayable API Works only.
 * User-library titles appear only when they resolve to displayable API Works.
 */
export function buildExploreContentItems(
  apiWorks: Work[],
  options: {
    moodTagsByWorkId?: Map<string, string[]>;
    userLibraryWorks?: Work[];
  } = {},
): ExploreContentItem[] {
  const { moodTagsByWorkId = new Map(), userLibraryWorks = [] } = options;
  const works = onlyDisplayable(apiWorks);
  const byTitle = new Map<string, ExploreContentItem>();
  const order: string[] = [];

  const put = (item: ExploreContentItem, force = false) => {
    const key = `${item.type ?? "BOOK"}:${workTitleIdentityKey(item.title) || item.id}`;
    const existing = byTitle.get(key);
    if (!existing) {
      byTitle.set(key, item);
      order.push(key);
      return;
    }

    const prefer =
      force ||
      item.source === "open_library" ||
      (isRemoteCoverUrl(item.coverUrl) && !isRemoteCoverUrl(existing.coverUrl));

    if (!prefer) return;

    byTitle.set(key, {
      ...existing,
      ...item,
      description: item.description.trim()
        ? item.description
        : existing.description,
      coverUrl: resolveCoverUrl(item.coverUrl, existing.coverUrl),
      tags:
        existing.tags && existing.tags.length > 0 && (!item.tags || item.tags.length === 0)
          ? existing.tags
          : item.tags,
      externalRatings:
        item.externalRatings && item.externalRatings.length > 0
          ? item.externalRatings
          : existing.externalRatings,
    });
  };

  for (const work of works) {
    put(
      workToExploreContentItem(work, moodTagsByWorkId.get(work.id) ?? []),
      true,
    );
  }

  for (const work of onlyDisplayable(userLibraryWorks)) {
    const key = `${work.type}:${workTitleIdentityKey(work.title) || work.id}`;
    if (byTitle.has(key)) continue;
    put(workToExploreContentItem(work, moodTagsByWorkId.get(work.id) ?? []));
  }

  return order.map((key) => byTitle.get(key)!).filter(Boolean);
}

export function buildExploreContentList(
  apiWorks: Work[] | null = null,
  moodTagsByWorkId: Map<string, string[]> = new Map(),
  userLibraryWorks: Work[] = [],
): Content[] {
  return buildExploreContentItems(apiWorks ?? [], {
    moodTagsByWorkId,
    userLibraryWorks,
  }).map(exploreItemToContent);
}

export function buildMoodTagMap(feed: ExploreApiFeed): Map<string, string[]> {
  const map = new Map<string, string[]>();

  const add = (works: Work[], tags: string[]) => {
    for (const work of works) {
      const existing = map.get(work.id) ?? [];
      map.set(work.id, Array.from(new Set([...existing, ...tags])));
    }
  };

  add(feed.byMood.quiet, ["quiet", "calm", "reflective", "gentle"]);
  add(feed.byMood.nostalgic, ["nostalgic", "melancholy", "memory", "bittersweet"]);
  add(feed.byMood.curious, ["curious", "dreamlike", "surreal", "mysterious"]);
  add(feed.trending, ["curious"]);
  add(feed.popular, ["quiet"]);
  add(feed.trendingMovies ?? [], ["curious", "cinematic"]);
  add(feed.popularMovies ?? [], ["quiet", "cinematic"]);
  add(feed.movieSections?.recent ?? [], ["curious"]);
  add(feed.trendingMusic ?? [], ["curious", "melancholy"]);
  add(feed.popularMusic ?? [], ["quiet", "nostalgic"]);
  add(feed.musicSections?.recent ?? [], ["curious"]);

  return map;
}

export function workToDiscoveryItem(
  work: Work,
  category: DiscoveryCategory,
  module: DiscoveryModule,
  reason: string,
): ExploreDiscoveryItem {
  const coverUrl = normalizeWorkCoverUrl(work.coverUrl, {
    source: work.source,
  });
  return {
    id: `api-${module}-${work.id}`,
    title: work.title,
    creator: work.creator,
    cover: coverUrl,
    coverUrl,
    category,
    source: "catalog",
    workSource: work.source ?? "open_library",
    reason: work.description.trim() || reason,
    module,
    contentId: work.id,
  };
}

function discoveryItemWorkType(item: ExploreDiscoveryItem): WorkType {
  if (item.category === "film") return "movie";
  if (item.category === "music") return "music";
  return "book";
}

function findImportedForDiscoveryItem(
  item: ExploreDiscoveryItem,
): Work | null {
  const expectedType = discoveryItemWorkType(item);
  const candidates = [
    item.contentId ? getImportedWorkById(item.contentId) : null,
    findImportedWorkByIdentity(item.title, item.creator),
    findImportedWorkByTitle(item.title),
  ].filter((work): work is Work => Boolean(work));

  const typed = candidates.find(
    (work) =>
      work.type === expectedType &&
      isApiBackedSource(work.source) &&
      isRemoteCoverUrl(work.coverUrl),
  );
  if (typed) return typed;

  return (
    candidates.find(
      (work) =>
        work.type === expectedType && isApiBackedSource(work.source),
    ) ?? null
  );
}

/**
 * Canonical discovery enrichment:
 * API / imported Work → editorial seed fallback.
 * Never replaces a remote cover with a gradient.
 */
export function enrichDiscoveryItem(
  item: ExploreDiscoveryItem,
): ExploreDiscoveryItem {
  const imported = findImportedForDiscoveryItem(item);
  if (imported) {
    return replaceDiscoveryItemWithWork(item, imported);
  }

  const coverUrl = normalizeWorkCoverUrl(
    resolveCoverUrl(item.coverUrl, item.cover),
    { source: item.workSource },
  );
  return {
    ...item,
    cover: coverUrl,
    coverUrl,
  };
}

/** Book discovery — displayable Open Library Works only. */
export function buildBookDiscoverySections(
  feed: ExploreApiFeed | null,
  importedBooks: Work[],
): ExploreDiscoverySection[] {
  const copy = DISCOVERY_MODULE_COPY.book;
  const trending = onlyDisplayable(feed?.trending ?? []);
  const popular = onlyDisplayable(feed?.popular ?? []);
  const imported = onlyDisplayable(importedBooks);

  if (trending.length > 0 || popular.length > 0) {
    const community = onlyDisplayable(
      feed?.byCuratedCategory[COMMUNITY_BOOK_CATEGORY] ?? popular,
    );

    return (
      [
        {
          module: "trending" as const,
          ...copy.trending,
          items: trending.slice(0, 12).map((work) =>
            workToDiscoveryItem(
              work,
              "book",
              "trending",
              "Rising among reflective readers on Open Library.",
            ),
          ),
        },
        {
          module: "new_release" as const,
          ...copy.new_release,
          items: popular.slice(0, 12).map((work) =>
            workToDiscoveryItem(
              work,
              "book",
              "new_release",
              "Widely read titles worth lingering with.",
            ),
          ),
        },
        {
          module: "community" as const,
          ...copy.community,
          items: community.slice(0, 12).map((work) =>
            workToDiscoveryItem(
              work,
              "book",
              "community",
              "Shared by readers exploring ideas and quiet questions.",
            ),
          ),
        },
      ] as ExploreDiscoverySection[]
    ).filter((section) => section.items.length > 0);
  }

  if (imported.length === 0) return [];

  return [
    {
      module: "trending",
      ...copy.trending,
      items: imported.slice(0, 12).map((work) =>
        workToDiscoveryItem(
          work,
          "book",
          "trending",
          "From your Open Library public catalog.",
        ),
      ),
    },
    {
      module: "new_release",
      ...copy.new_release,
      items: imported.slice(0, 12).map((work) =>
        workToDiscoveryItem(
          work,
          "book",
          "new_release",
          "Imported from Open Library.",
        ),
      ),
    },
    {
      module: "community",
      ...copy.community,
      items: imported.slice(0, 12).map((work) =>
        workToDiscoveryItem(
          work,
          "book",
          "community",
          "Shared Open Library metadata.",
        ),
      ),
    },
  ];
}

/** Film discovery — displayable TMDB Works only. */
export function buildFilmDiscoverySections(
  feed: ExploreApiFeed | null,
  importedMovies: Work[] = [],
): ExploreDiscoverySection[] {
  const imported = onlyDisplayable(importedMovies);
  const trending = onlyDisplayable(
    feed?.trendingMovies?.length
      ? feed.trendingMovies
      : imported.filter((work) => work.source === "tmdb"),
  );
  const popular = onlyDisplayable(
    feed?.popularMovies?.length
      ? feed.popularMovies
      : imported.filter((work) => work.type === "movie"),
  );
  const recent = onlyDisplayable(
    feed?.movieSections?.recent?.length
      ? feed.movieSections.recent
      : sortMoviesByReleaseDateDesc(popular),
  );

  if (trending.length === 0 && popular.length === 0 && recent.length === 0) {
    return [];
  }

  const toItem = (
    work: Work,
    module: DiscoveryModule,
    fallbackReason: string,
  ) => {
    const rating = work.externalRatings?.[0];
    const ratingHint =
      rating != null
        ? `TMDB ${Math.round(rating.value * 10) / 10}/${rating.scale}`
        : "";
    const reason =
      work.description.trim() ||
      [fallbackReason, ratingHint].filter(Boolean).join(" · ");

    return workToDiscoveryItem(work, "film", module, reason);
  };

  return (
    [
      {
        module: "trending" as const,
        title: "Trending Movies",
        description: "Films rising across TMDB this week",
        items: trending
          .slice(0, 12)
          .map((work) =>
            toItem(work, "trending", "Trending on TMDB."),
          ),
      },
      {
        module: "new_release" as const,
        title: "Popular Movies",
        description: "Widely watched titles with lasting cultural pull",
        items: popular
          .slice(0, 12)
          .map((work) =>
            toItem(work, "new_release", "Popular on TMDB."),
          ),
      },
      {
        module: "community" as const,
        title: "Recently Released",
        description: "Newer releases worth catching up on",
        items: recent
          .slice(0, 12)
          .map((work) =>
            toItem(
              work,
              "community",
              work.releaseDate
                ? `Released ${work.releaseDate}.`
                : "Recent on TMDB.",
            ),
          ),
      },
    ] as ExploreDiscoverySection[]
  ).filter((section) => section.items.length > 0);
}

/** Music discovery — displayable Last.fm Works only. */
export function buildMusicDiscoverySections(
  feed: ExploreApiFeed | null,
  importedMusic: Work[] = [],
): ExploreDiscoverySection[] {
  const imported = onlyDisplayable(importedMusic);
  const trending = onlyDisplayable(
    feed?.trendingMusic?.length
      ? feed.trendingMusic
      : imported.filter((work) => work.source === "lastfm"),
  );
  const popular = onlyDisplayable(
    feed?.popularMusic?.length
      ? feed.popularMusic
      : imported.filter((work) => work.type === "music"),
  );
  const recent = onlyDisplayable(
    feed?.musicSections?.recent?.length
      ? feed.musicSections.recent
      : sortMusicByPopularityDesc(popular),
  );

  if (trending.length === 0 && popular.length === 0 && recent.length === 0) {
    return [];
  }

  const toItem = (
    work: Work,
    module: DiscoveryModule,
    fallbackReason: string,
  ) => {
    const listeners =
      typeof work.metadata?.listeners === "number"
        ? work.metadata.listeners
        : null;
    const listenerHint =
      listeners != null && listeners > 0
        ? `${listeners.toLocaleString()} listeners`
        : "";
    const reason =
      work.description.trim() ||
      [fallbackReason, listenerHint].filter(Boolean).join(" · ");

    return workToDiscoveryItem(work, "music", module, reason);
  };

  return (
    [
      {
        module: "trending" as const,
        title: "Trending Music",
        description: "Tracks and albums rising on Last.fm",
        items: trending
          .slice(0, 12)
          .map((work) =>
            toItem(work, "trending", "Trending on Last.fm."),
          ),
      },
      {
        module: "new_release" as const,
        title: "Popular Music",
        description: "Widely loved records with lasting pull",
        items: popular
          .slice(0, 12)
          .map((work) =>
            toItem(work, "new_release", "Popular on Last.fm."),
          ),
      },
      {
        module: "community" as const,
        title: "Recently Discovered",
        description: "Fresh finds surfacing in the public catalog",
        items: recent
          .slice(0, 12)
          .map((work) =>
            toItem(work, "community", "Discovered on Last.fm."),
          ),
      },
    ] as ExploreDiscoverySection[]
  ).filter((section) => section.items.length > 0);
}

/**
 * Editorial seed fallback — disabled on live surfaces.
 * Kept as an empty adapter so callers do not crash; returns [].
 */
export function buildEditorialDiscoverySections(
  _category: DiscoveryCategory,
): ExploreDiscoverySection[] {
  return [];
}

export function buildCuratedListsFromFeed(
  feed: ExploreApiFeed | null,
  importedBooks: Work[],
): CuratedList[] {
  const displayableImported = onlyDisplayable(importedBooks);

  if (feed) {
    return CURATED_LIST_DEFINITIONS.flatMap((def) => {
      const works = onlyDisplayable(
        feed.byCuratedCategory[def.apiCategory] ?? [],
      );
      const slice =
        works.length > 0
          ? works.slice(0, 8)
          : displayableImported.slice(0, 8);
      if (slice.length === 0) return [];

      return [
        {
          id: def.id,
          title: def.title,
          creator: def.creator,
          description: def.description,
          cover: resolveCoverUrl(slice[0]?.coverUrl, def.cover),
          items: slice.map((work) => work.id),
        },
      ];
    });
  }

  if (displayableImported.length > 0) {
    return CURATED_LIST_DEFINITIONS.flatMap((def, index) => {
      const slice = displayableImported.slice(index * 3, index * 3 + 8);
      const pool = slice.length > 0 ? slice : displayableImported.slice(0, 8);
      if (pool.length === 0) return [];
      return [
        {
          id: def.id,
          title: def.title,
          creator: def.creator,
          description: def.description,
          cover: resolveCoverUrl(pool[0]?.coverUrl, def.cover),
          items: pool.map((work) => work.id),
        },
      ];
    });
  }

  return [];
}

export function resolveExploreContentById(id: string): Content | null {
  const imported = getImportedWorkById(id);
  if (imported && isDisplayableApiWork(imported)) {
    return workToExploreContent(imported);
  }

  const catalog = getContentById(id);
  if (!catalog) return null;

  const byTitle = findImportedWorkByTitle(catalog.title);
  if (byTitle && isDisplayableApiWork(byTitle)) {
    return workToExploreContent(byTitle);
  }

  // Never surface mock catalog ids on live Explore surfaces.
  return null;
}

export function resolveExploreContentsByIds(ids: string[]): Content[] {
  return ids
    .map((id) => resolveExploreContentById(id))
    .filter((item): item is Content => item !== null);
}

/** Runtime log payload — coverUrl never a gradient when API data exists. */
export function toExploreDataLog(items: ExploreContentItem[] | Content[]) {
  return items.map((item) => {
    const coverUrl =
      "coverUrl" in item && typeof item.coverUrl === "string"
        ? item.coverUrl
        : "cover" in item
          ? item.cover
          : "";
    return {
      title: item.title,
      source: item.source,
      coverUrl,
      description: item.description,
    };
  });
}
