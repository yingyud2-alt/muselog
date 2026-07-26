"use client";

import type { WorkBubble } from "@/components/dashboard/mood-bubble-data";
import {
  findCatalogContentForBubble,
  resolveBubbleMediaKey,
} from "@/lib/content/bubble-content-bridge";
import { openWorkPreview } from "@/lib/detail/detail-overlay-store";
import {
  contentToWork,
  toContentType,
  toWorkType,
} from "@/lib/work/work-adapters";

/** Open Level-1 preview for a Home bubble via the unified Work model. */
export function openBubblePreview(workBubble: WorkBubble) {
  const mediaKey = resolveBubbleMediaKey(workBubble);
  const catalog = findCatalogContentForBubble(workBubble);
  const work = catalog
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
      cover: work?.coverUrl,
      tags: work?.moodTags ?? workBubble.tags ?? work?.genres,
      description: work?.description ?? workBubble.quote,
    },
  });
}
