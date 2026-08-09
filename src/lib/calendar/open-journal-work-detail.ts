"use client";

import { resolveJournalWorkId } from "@/lib/calendar/resolve-journal-work-cover";
import { mediaTypeToContentType } from "@/lib/content/bubble-content-bridge";
import {
  openJournalMemoryDetail,
  openWorkDetail,
} from "@/lib/detail/detail-overlay-store";
import { cleanDescription } from "@/lib/work/clean-description";
import { isApiBackedSource } from "@/lib/work/content-layers";
import {
  resolveCanonicalCoverUrl,
  resolveCanonicalWork,
} from "@/lib/work/resolve-canonical-work";
import type { MediaItem } from "@/types/media";

/**
 * Calendar card → JournalMemoryDetailModal.
 * Does not open WorkDetailModal directly.
 */
export function openJournalCalendarWorkDetail(item: MediaItem) {
  if (item.id.startsWith("checkin-")) return;
  openJournalMemoryDetail(item.id);
}

/** Secondary action from Journal Memory Detail → existing WorkDetailModal. */
export function openJournalEntryWorkDetail(item: MediaItem) {
  if (item.id.startsWith("checkin-")) return;

  const workId = resolveJournalWorkId(item);
  if (!workId.trim()) return;

  const work = resolveCanonicalWork({
    workId,
    title: item.title,
    creator: item.creator,
    type: item.type,
  });
  const resolvedId =
    work && isApiBackedSource(work.source) ? work.id : workId;

  openWorkDetail(resolvedId, {
    snapshot: {
      title: work?.title ?? item.title,
      creator: work?.creator ?? item.creator,
      type: mediaTypeToContentType(work?.type ?? item.type),
      cover: resolveCanonicalCoverUrl({
        workId: resolvedId,
        title: item.title,
        creator: item.creator,
        type: item.type,
        journalCover: item.cover,
      }),
      tags: (work?.moodTags?.length
        ? work.moodTags
        : work?.genres?.length
          ? work.genres
          : item.tags
      ).slice(0, 4),
      description: work?.description
        ? cleanDescription(work.description)
        : undefined,
    },
  });
}
