import { CONTENT_CATALOG } from "@/lib/content/content-data";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import type { Content } from "@/lib/content/types";

export type SearchResult = Content & {
  matchField: "title" | "creator" | "tag";
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function searchContentCatalog(query: string): SearchResult[] {
  const normalized = normalize(query);

  if (!normalized) {
    return [];
  }

  const results: SearchResult[] = [];

  for (const item of CONTENT_CATALOG) {
    if (normalize(item.title).includes(normalized)) {
      results.push({ ...item, matchField: "title" });
      continue;
    }

    if (normalize(item.creator).includes(normalized)) {
      results.push({ ...item, matchField: "creator" });
      continue;
    }

    if (item.tags.some((tag) => normalize(tag).includes(normalized))) {
      results.push({ ...item, matchField: "tag" });
    }
  }

  return results;
}

export function formatSearchResultMeta(content: Content): string {
  const role =
    content.type === "BOOK"
      ? "Author"
      : content.type === "MOVIE"
        ? "Director"
        : "Artist";

  return `${role}: ${content.creator} · ${CONTENT_TYPE_LABELS[content.type]}`;
}
