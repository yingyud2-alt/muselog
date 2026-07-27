"use client";

/**
 * Unified Explore content provider — API-first public catalog.
 *
 * Priority:
 *   1. Open Library imported / discovery Works
 *   2. Other API sources (future TMDB / Spotify)
 *   3. CONTENT_CATALOG / editorial seed only when API has no data
 *
 * Persists discovery into imported-work-catalog (public cache only —
 * never writes user-media-state / Library).
 */

import {
  CONTENT_CATALOG,
  getContentById,
} from "@/lib/content/content-data";
import type { ExploreMood } from "@/lib/content/constants";
import {
  CURATED_LIST_DEFINITIONS,
  CURATED_LISTS,
} from "@/lib/content/curated-lists";
import {
  DISCOVERY_MODULE_COPY,
  getDiscoverySections,
  type DiscoveryCategory,
  type DiscoveryModule,
  type ExploreDiscoveryItem,
} from "@/lib/content/explore-discovery";
import type {
  Content,
  ContentSource,
  CuratedList,
} from "@/lib/content/types";
import { isRemoteCoverUrl, resolveCoverUrl } from "@/lib/work/cover-url";
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
import type { ExternalRating, Work } from "@/types/work";

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

export type ExploreApiFeed = {
  trending: Work[];
  popular: Work[];
  byMood: Record<ExploreMood, Work[]>;
  byCuratedCategory: Record<string, Work[]>;
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

/** Merge Works by title identity (handles EN/JA author mismatch). */
export function mergeWorksByTitleIdentity(works: Work[]): Work[] {
  const byTitle = new Map<string, Work>();

  for (const work of works) {
    const key =
      workTitleIdentityKey(work.title) ||
      workIdentityKey(work.title, work.creator) ||
      work.id;
    byTitle.set(key, preferApiWork(work, byTitle.get(key)));
  }

  return Array.from(byTitle.values());
}

export function dedupeWorks(works: Work[]): Work[] {
  return mergeWorksByTitleIdentity(works);
}

/** Work → Explore card contract (coverUrl preserved). */
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

  return {
    id: work.id,
    title: work.title,
    creator: work.creator,
    coverUrl: work.coverUrl,
    description: work.description,
    source: work.source ?? "manual",
    type: toContentType(work.type),
    tags,
    externalRatings: work.externalRatings,
    externalId: work.externalId,
  };
}

/** ExploreContentItem → existing Content UI shape (cover mirrors coverUrl). */
export function exploreItemToContent(item: ExploreContentItem): Content {
  return {
    id: item.id,
    type: item.type ?? "BOOK",
    title: item.title,
    creator: item.creator,
    cover: item.coverUrl,
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

/** Persist public catalog Works only — never writes User Library status. */
export function persistPublicCatalogWorks(works: Work[]) {
  for (const work of works) {
    persistImportedWork(work);
  }
}

/**
 * Fetch Open Library discovery + seed searches; persist into imported-work-catalog.
 */
export async function loadExploreApiFeed(): Promise<ExploreApiFeed | null> {
  if (feedCache) return feedCache;
  if (feedPromise) return feedPromise;

  feedPromise = (async () => {
    try {
      const [norwegian, littlePrince, kafka, bootstrap] = await Promise.all([
        fetchSearchWorks("Norwegian Wood", 5),
        fetchSearchWorks("The Little Prince", 4),
        fetchSearchWorks("Kafka on the Shore", 4),
        fetchDiscoverWorks("bootstrap", { limit: 24 }),
      ]);

      const seed = dedupeWorks([
        ...norwegian,
        ...littlePrince,
        ...kafka,
        ...bootstrap,
      ]);

      if (seed.length > 0) {
        persistPublicCatalogWorks(seed);
      }

      const [trendingRaw, popularRaw] = await Promise.all([
        fetchDiscoverWorks("trending", { limit: 24 }),
        fetchDiscoverWorks("popular", { limit: 24 }),
      ]);

      let trending = trendingRaw.length > 0 ? trendingRaw : seed;
      let popular = popularRaw.length > 0 ? popularRaw : seed;

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
        const works = await fetchDiscoverWorks("category", {
          category,
          limit: 12,
        });
        moodWorks.push(works.length > 0 ? works : trending.slice(0, 12));
      }

      const curatedWorks: Work[][] = [];
      for (const category of curatedCategories) {
        const works = await fetchDiscoverWorks("category", {
          category,
          limit: 10,
        });
        curatedWorks.push(works.length > 0 ? works : popular.slice(0, 8));
      }

      const communityRaw = await fetchDiscoverWorks("category", {
        category: COMMUNITY_BOOK_CATEGORY,
        limit: 12,
      });
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

      const all = dedupeWorks([
        ...seed,
        ...trending,
        ...popular,
        ...Object.values(byMood).flat(),
        ...Object.values(byCuratedCategory).flat(),
      ]);

      if (all.length === 0) {
        feedCache = null;
        return null;
      }

      persistPublicCatalogWorks(all);
      const feed: ExploreApiFeed = {
        trending: mergeWorksByTitleIdentity(trending),
        popular: mergeWorksByTitleIdentity(popular),
        byMood: {
          quiet: mergeWorksByTitleIdentity(byMood.quiet),
          nostalgic: mergeWorksByTitleIdentity(byMood.nostalgic),
          curious: mergeWorksByTitleIdentity(byMood.curious),
        },
        byCuratedCategory: Object.fromEntries(
          Object.entries(byCuratedCategory).map(([key, works]) => [
            key,
            mergeWorksByTitleIdentity(works),
          ]),
        ),
      };
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

/** Merge discovery feed + imported catalog (Open Library first). */
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
      ]
    : [];

  return mergeWorksByTitleIdentity([
    ...fromFeed,
    ...imported.filter((work) => work.type === "book"),
  ]);
}

/**
 * Build Explore grid items.
 * Priority: open_library → other API → user library → CONTENT_CATALOG fallback.
 */
export function buildExploreContentItems(
  apiWorks: Work[],
  options: {
    moodTagsByWorkId?: Map<string, string[]>;
    userLibraryWorks?: Work[];
  } = {},
): ExploreContentItem[] {
  const { moodTagsByWorkId = new Map(), userLibraryWorks = [] } = options;
  const works = mergeWorksByTitleIdentity(apiWorks);
  const byTitle = new Map<string, ExploreContentItem>();
  const order: string[] = [];

  const put = (item: ExploreContentItem, force = false) => {
    const key = workTitleIdentityKey(item.title) || item.id;
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

  // 1) Open Library / API public catalog
  for (const work of works) {
    put(
      workToExploreContentItem(work, moodTagsByWorkId.get(work.id) ?? []),
      true,
    );
  }

  // 2) User library titles not already covered
  for (const work of userLibraryWorks) {
    const key = workTitleIdentityKey(work.title) || work.id;
    if (byTitle.has(key)) continue;
    put(workToExploreContentItem(work, moodTagsByWorkId.get(work.id) ?? []));
  }

  // 3) CONTENT_CATALOG only for titles with no API twin
  for (const content of CONTENT_CATALOG) {
    const key = workTitleIdentityKey(content.title) || content.id;
    if (byTitle.has(key)) continue;
    // When API books exist, skip mock books — keep film/music placeholders.
    if (works.length > 0 && content.type === "BOOK") continue;
    put({
      id: content.id,
      title: content.title,
      creator: content.creator,
      coverUrl: content.cover,
      description: content.description,
      source: content.source,
      type: content.type,
      tags: content.tags,
    });
  }

  if (byTitle.size === 0) {
    return CONTENT_CATALOG.map((content) => ({
      id: content.id,
      title: content.title,
      creator: content.creator,
      coverUrl: content.cover,
      description: content.description,
      source: content.source,
      type: content.type,
      tags: content.tags,
    }));
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

  return map;
}

export function workToDiscoveryItem(
  work: Work,
  category: DiscoveryCategory,
  module: DiscoveryModule,
  reason: string,
): ExploreDiscoveryItem {
  return {
    id: `api-${module}-${work.id}`,
    title: work.title,
    creator: work.creator,
    cover: work.coverUrl,
    coverUrl: work.coverUrl,
    category,
    source: "catalog",
    workSource: work.source ?? "open_library",
    reason: work.description.trim() || reason,
    module,
    contentId: work.id,
  };
}

export function enrichDiscoveryItem(
  item: ExploreDiscoveryItem,
): ExploreDiscoveryItem {
  const imported =
    (item.contentId ? getImportedWorkById(item.contentId) : null) ??
    findImportedWorkByIdentity(item.title, item.creator) ??
    findImportedWorkByTitle(item.title);

  if (!imported) return item;

  const coverUrl = resolveCoverUrl(imported.coverUrl, item.coverUrl, item.cover);

  return {
    ...item,
    cover: coverUrl,
    coverUrl,
    contentId: imported.id,
    creator: imported.creator || item.creator,
    reason: imported.description.trim() || item.reason,
    source: "catalog",
    workSource: imported.source ?? item.workSource ?? "open_library",
  };
}

/** Book discovery — API/imported only; never editorial mock when data exists. */
export function buildBookDiscoverySections(
  feed: ExploreApiFeed | null,
  importedBooks: Work[],
): ExploreDiscoverySection[] {
  const copy = DISCOVERY_MODULE_COPY.book;

  if (feed && (feed.trending.length > 0 || feed.popular.length > 0)) {
    const community =
      feed.byCuratedCategory[COMMUNITY_BOOK_CATEGORY] ?? feed.popular;

    return (
      [
        {
          module: "trending" as const,
          ...copy.trending,
          items: feed.trending.slice(0, 12).map((work) =>
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
          items: feed.popular.slice(0, 12).map((work) =>
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

  if (importedBooks.length === 0) return [];

  return [
    {
      module: "trending",
      ...copy.trending,
      items: importedBooks.slice(0, 12).map((work) =>
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
      items: importedBooks.slice(0, 12).map((work) =>
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
      items: importedBooks.slice(0, 12).map((work) =>
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

/** Film / music (no provider yet) — editorial seed, enriched when possible. */
export function buildEditorialDiscoverySections(
  category: DiscoveryCategory,
): ExploreDiscoverySection[] {
  return getDiscoverySections(category).map((section) => ({
    ...section,
    items: section.items.map(enrichDiscoveryItem),
  }));
}

export function buildCuratedListsFromFeed(
  feed: ExploreApiFeed | null,
  importedBooks: Work[],
): CuratedList[] {
  if (feed) {
    return CURATED_LIST_DEFINITIONS.map((def) => {
      const works = feed.byCuratedCategory[def.apiCategory] ?? [];
      if (works.length === 0 && importedBooks.length === 0) {
        return {
          id: def.id,
          title: def.title,
          creator: def.creator,
          description: def.description,
          cover: def.cover,
          items: def.fallbackItems,
        };
      }

      const slice =
        works.length > 0
          ? works.slice(0, 8)
          : importedBooks.slice(0, 8);

      return {
        id: def.id,
        title: def.title,
        creator: def.creator,
        description: def.description,
        cover: resolveCoverUrl(slice[0]?.coverUrl, def.cover),
        items: slice.map((work) => work.id),
      };
    });
  }

  if (importedBooks.length > 0) {
    return CURATED_LIST_DEFINITIONS.map((def, index) => {
      const slice = importedBooks.slice(index * 3, index * 3 + 8);
      if (slice.length === 0) {
        // Reuse pool rather than mock catalog ids when API imports exist.
        const fallbackSlice = importedBooks.slice(0, 8);
        return {
          id: def.id,
          title: def.title,
          creator: def.creator,
          description: def.description,
          cover: resolveCoverUrl(fallbackSlice[0]?.coverUrl, def.cover),
          items: fallbackSlice.map((work) => work.id),
        };
      }
      return {
        id: def.id,
        title: def.title,
        creator: def.creator,
        description: def.description,
        cover: resolveCoverUrl(slice[0]?.coverUrl, def.cover),
        items: slice.map((work) => work.id),
      };
    });
  }

  return CURATED_LISTS;
}

export function resolveExploreContentById(id: string): Content | null {
  const imported = getImportedWorkById(id);
  if (imported) return workToExploreContent(imported);

  const catalog = getContentById(id);
  if (!catalog) return null;

  const byTitle = findImportedWorkByTitle(catalog.title);
  if (byTitle) return workToExploreContent(byTitle);

  return catalog;
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
