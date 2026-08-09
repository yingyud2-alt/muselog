"use client";

import type { WorkBubble } from "@/components/dashboard/mood-bubble-data";
import {
  findCatalogContentForBubble,
  resolveBubbleMediaKey,
} from "@/lib/content/bubble-content-bridge";
import { openWorkPreview } from "@/lib/detail/detail-overlay-store";
import { cleanDescription } from "@/lib/work/clean-description";
import { getImportedWorkById } from "@/lib/work/imported-work-catalog";
import {
  contentToWork,
  toContentType,
  toWorkType,
} from "@/lib/work/work-adapters";

/** Open Level-1 preview for a Home bubble via the unified Work model. */
export function openBubblePreview(workBubble: WorkBubble) {
  // Prefer canonical API workId — never invent bubble-* mock identities.
  if (!workBubble.workId?.trim() && !workBubble.title?.trim()) {
    return;
  }

  const imported = workBubble.workId
    ? getImportedWorkById(workBubble.workId)
    : null;
  const mediaKey = resolveBubbleMediaKey(workBubble);
  const catalog = imported ? null : findCatalogContentForBubble(workBubble);
  const work = imported
    ? imported
    : catalog
      ? contentToWork(catalog, {
          moodTags: workBubble.tags ?? catalog.tags.slice(0, 4),
          userNotes: workBubble.quote,
        })
      : null;

  openWorkPreview(mediaKey, {
    snapshot: {
      title: work?.title ?? workBubble.title,
      creator: work?.creator ?? workBubble.creator,
      type: work
        ? toContentType(work.type)
        : toContentType(toWorkType(workBubble.type)),
      cover: work?.coverUrl ?? workBubble.coverUrl,
      tags: work?.moodTags ?? workBubble.tags ?? work?.genres,
      description: cleanDescription(
        work?.description || workBubble.quote,
      ),
    },
  });
}
