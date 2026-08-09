import {
  mediaKeyFromJournalItemId,
} from "@/lib/content/bubble-content-bridge";
import { getContentById } from "@/lib/content/content-data";
import {
  resolveCanonicalCoverUrl,
  resolveCanonicalWork,
  toCanonicalWorkLog,
} from "@/lib/work/resolve-canonical-work";
import type { Work } from "@/types/work";
import { MEDIA_EXPLORE_IDS, type MediaItem } from "@/types/media";

/**
 * Journal entry → Work id for catalog lookup.
 * Prefer Explore bridge maps, then journal- prefixed media keys.
 */
export function resolveJournalWorkId(item: Pick<MediaItem, "id">): string {
  const mapped = MEDIA_EXPLORE_IDS[item.id];
  if (mapped) return mapped;
  if (item.id.startsWith("journal-")) {
    return mediaKeyFromJournalItemId(item.id);
  }
  return item.id;
}

/**
 * Journal Calendar / Memory cover — never permanently prefer snapshot.
 * Priority: canonicalWork.coverUrl → library cover → journal snapshot → catalog
 */
export function resolveJournalDisplayCover(
  item: MediaItem,
  libraryCover?: string | null,
): string {
  const workId = resolveJournalWorkId(item);
  const catalog = getContentById(workId);
  return resolveCanonicalCoverUrl({
    workId,
    title: item.title,
    creator: item.creator,
    type: item.type,
    libraryCover,
    journalCover: item.cover,
    catalogCover: catalog?.cover,
  });
}

/**
 * Bind MediaItem.cover from canonical Work for calendar rendering.
 * Does not mutate journal storage — read-time overlay only.
 */
export function bindJournalEntryCoverFromWork(
  item: MediaItem,
  importedMap?: Record<string, Work>,
): MediaItem {
  const workId = resolveJournalWorkId(item);
  // importedMap is keyed by API id; use it as a fast path when present.
  const fromMap = workId ? importedMap?.[workId] : undefined;
  const canonical =
    fromMap ??
    resolveCanonicalWork({
      workId,
      title: item.title,
      creator: item.creator,
      type: item.type,
    });

  const cover = resolveJournalDisplayCover(item);
  if (process.env.NODE_ENV !== "production") {
    const title = item.title?.trim() ?? "";
    if (
      /kafka on the shore|norwegian wood|perfect days|before sunrise|the little prince/i.test(
        title,
      )
    ) {
      // eslint-disable-next-line no-console
      console.info(
        "[canonical-work:journal-calendar]",
        toCanonicalWorkLog("journal-calendar", workId, {
          workId,
          title: item.title,
          creator: item.creator,
          type: item.type,
        }),
      );
    }
  }

  if (cover === item.cover && (!canonical || canonical.id === workId)) {
    return item;
  }
  return { ...item, cover };
}
