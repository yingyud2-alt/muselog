"use client";

/**
 * Gate for production MuseLog surfaces.
 * Only real provider-backed Works with a remote cover may enter
 * Explore / Home / Library / Journal / Calendar.
 */

import { isRemoteCoverUrl } from "@/lib/work/cover-url";
import {
  isApiWorkId,
  isLegacyCatalogWorkId,
  resolveCanonicalWork,
} from "@/lib/work/resolve-canonical-work";
import type { MediaItem } from "@/types/media";
import type { Work } from "@/types/work";

const DISPLAYABLE_SOURCES = new Set([
  "open_library",
  "tmdb",
  "lastfm",
]);

function hasHttpCover(coverUrl: string | null | undefined): boolean {
  const value = coverUrl?.trim() ?? "";
  if (!value) return false;
  if (!(value.startsWith("https://") || value.startsWith("http://"))) {
    return false;
  }
  return isRemoteCoverUrl(value);
}

/**
 * A work may enter Explore/Home/Library/Journal only when it is a real
 * API-backed Work with provider identity and a valid remote cover.
 */
export function isDisplayableApiWork(
  work: Pick<Work, "title" | "coverUrl" | "source" | "externalId"> | null | undefined,
): boolean {
  if (!work) return false;
  if (!work.title?.trim()) return false;
  if (!work.externalId?.trim()) return false;
  const source = work.source?.trim().toLowerCase() ?? "";
  if (!DISPLAYABLE_SOURCES.has(source)) return false;
  return hasHttpCover(work.coverUrl);
}

export function filterDisplayableApiWorks(works: Work[]): Work[] {
  return works.filter((work) => isDisplayableApiWork(work));
}

/**
 * Journal/calendar entry may render only when it resolves to a displayable
 * API Work. Unresolved legacy mock ids stay hidden (data is not deleted).
 */
export function isDisplayableJournalEntry(item: MediaItem): boolean {
  const workId = item.id.startsWith("journal-")
    ? item.id.replace(/^journal-/, "")
    : item.id;

  // Calendar mock seeds never enter production surfaces.
  if (workId.startsWith("calendar-") || item.id.startsWith("calendar-")) {
    return false;
  }

  const canonical = resolveCanonicalWork({
    workId,
    title: item.title,
    creator: item.creator,
    type: item.type,
  });

  if (canonical && isDisplayableApiWork(canonical)) return true;

  // Legacy catalog ids without a confident API match stay hidden.
  if (isLegacyCatalogWorkId(workId) && !isApiWorkId(workId)) {
    return false;
  }

  return false;
}

/** Dev/review log for unresolved legacy journal rows (never deletes data). */
export function logUnresolvedLegacyJournalEntries(entries: MediaItem[]) {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "production") return;

  const unresolved = entries.filter((entry) => {
    const workId = entry.id.replace(/^journal-/, "").replace(/^calendar-/, "");
    if (!isLegacyCatalogWorkId(workId) && !entry.id.startsWith("calendar-")) {
      return false;
    }
    return !isDisplayableJournalEntry(entry);
  });

  if (unresolved.length === 0) return;
  // eslint-disable-next-line no-console
  console.info(
    "[legacy-journal:unresolved]",
    unresolved.map((entry) => ({
      id: entry.id,
      title: entry.title,
      type: entry.type,
      cover: entry.cover,
    })),
  );
}

/** Count displayable API works by media type (for verification reports). */
export function countDisplayableApiWorksByType(works: Work[]): {
  book: number;
  movie: number;
  music: number;
} {
  const displayable = filterDisplayableApiWorks(works);
  return {
    book: displayable.filter((work) => work.type === "book").length,
    movie: displayable.filter((work) => work.type === "movie").length,
    music: displayable.filter((work) => work.type === "music").length,
  };
}
