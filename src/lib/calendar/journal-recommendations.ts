import { CONTENT_CATALOG } from "@/lib/content/content-data";
import { getContentByMediaKey } from "@/lib/content/bubble-content-bridge";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import type { Content, ContentType } from "@/lib/content/types";
import { MEDIA_EXPLORE_IDS } from "@/types/media";
import type { MediaItem } from "@/types/media";

export type JournalRecommendationMatch =
  | "title"
  | "creator"
  | "tag"
  | "category"
  | "related";

/** API-ready recommendation shape for future AI integration. */
export type JournalRecommendation = {
  content: Content;
  reason: string;
  matchType: JournalRecommendationMatch;
  anchorTitle?: string;
  score: number;
};

export type JournalCatalogSearchResult = {
  query: string;
  directMatches: Content[];
  recommendations: JournalRecommendation[];
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function getJournalContentIds(items: MediaItem[]): Set<string> {
  const ids = new Set<string>();

  for (const item of items) {
    const exploreId = MEDIA_EXPLORE_IDS[item.id];
    if (exploreId) ids.add(exploreId);
    if (item.id.startsWith("journal-")) {
      ids.add(item.id.replace(/^journal-/, ""));
    }
  }

  return ids;
}

function matchContent(content: Content, normalized: string): JournalRecommendationMatch | null {
  if (normalize(content.title).includes(normalized)) return "title";
  if (normalize(content.creator).includes(normalized)) return "creator";
  if (content.tags.some((tag) => normalize(tag).includes(normalized))) return "tag";
  if (normalize(content.description).includes(normalized)) return "category";
  return null;
}

function sharedTagCount(left: Content, right: Content): number {
  const rightTags = new Set(right.tags.map(normalize));
  return left.tags.filter((tag) => rightTags.has(normalize(tag))).length;
}

function buildRelatedRecommendations(
  anchor: Content,
  excluded: Set<string>,
  limit = 4,
): JournalRecommendation[] {
  const related: JournalRecommendation[] = [];

  for (const entry of CONTENT_CATALOG) {
    if (entry.id === anchor.id || excluded.has(entry.id)) continue;

    const sharedTags = sharedTagCount(anchor, entry);
    const sameCreator =
      normalize(entry.creator) === normalize(anchor.creator) ? 2 : 0;
    const sameType = entry.type === anchor.type ? 1 : 0;
    const score = sharedTags * 3 + sameCreator + sameType;

    if (score <= 0) continue;

    const sharedTag = anchor.tags.find((tag) =>
      entry.tags.some((other) => normalize(other) === normalize(tag)),
    );

    const reason = sharedTag
      ? `Shares the ${sharedTag} mood with ${anchor.title}`
      : normalize(entry.creator) === normalize(anchor.creator)
        ? `More from ${anchor.creator}`
        : `Similar ${CONTENT_TYPE_LABELS[entry.type].toLowerCase()} tone`;

    related.push({
      content: entry,
      reason,
      matchType: "related",
      anchorTitle: anchor.title,
      score,
    });
  }

  return related.sort((left, right) => right.score - left.score).slice(0, limit);
}

export function searchJournalCatalog(
  query: string,
  journalItems: MediaItem[],
): JournalCatalogSearchResult {
  const normalized = normalize(query);
  const excluded = getJournalContentIds(journalItems);

  if (!normalized) {
    return { query, directMatches: [], recommendations: [] };
  }

  const directMatches: Content[] = [];
  const recommendations: JournalRecommendation[] = [];
  const seenRecommendations = new Set<string>();

  for (const entry of CONTENT_CATALOG) {
    if (excluded.has(entry.id)) continue;

    const matchType = matchContent(entry, normalized);
    if (!matchType) continue;

    directMatches.push(entry);

    for (const related of buildRelatedRecommendations(entry, excluded)) {
      if (seenRecommendations.has(related.content.id)) continue;
      if (directMatches.some((match) => match.id === related.content.id)) continue;

      seenRecommendations.add(related.content.id);
      recommendations.push({
        ...related,
        reason:
          matchType === "title"
            ? `Because you searched for ${entry.title}`
            : related.reason,
      });
    }
  }

  if (directMatches.length === 0) {
    const tagMatches = CONTENT_CATALOG.filter((entry) => {
      if (excluded.has(entry.id)) return false;
      return entry.tags.some((tag) => normalize(tag).includes(normalized));
    });

    for (const entry of tagMatches.slice(0, 6)) {
      directMatches.push(entry);
      recommendations.push({
        content: entry,
        reason: `Matches the “${normalized}” mood`,
        matchType: "tag",
        score: 2,
      });
    }
  }

  return {
    query,
    directMatches: directMatches.slice(0, 8),
    recommendations: recommendations.slice(0, 6),
  };
}

export function contentToSelection(content: Content) {
  return {
    mediaKey: content.id,
    type: content.type,
    title: content.title,
    creator: content.creator,
    cover: content.cover,
  };
}

export function resolveSelectionCover(mediaKey: string, fallback?: string): string {
  return getContentByMediaKey(mediaKey)?.cover ?? fallback ?? "from-slate-800 via-slate-900 to-black";
}

export function ongoingStatusLabel(type: ContentType): string {
  if (type === "MOVIE") return "Watching";
  if (type === "MUSIC") return "Listening";
  return "Reading";
}
