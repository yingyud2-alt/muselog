"use client";

import type { ExploreDiscoveryItem } from "@/lib/content/explore-discovery";
import type { Content, ContentType } from "@/lib/content/types";
import {
  openWorkDetail,
  type WorkPreviewSnapshot,
} from "@/lib/detail/detail-overlay-store";
import { cleanDescription } from "@/lib/work/clean-description";
import { isApiBackedSource } from "@/lib/work/content-layers";
import {
  resolveCanonicalCoverUrl,
  resolveCanonicalWork,
  toCanonicalWorkLog,
} from "@/lib/work/resolve-canonical-work";

function categoryToContentType(
  category: ExploreDiscoveryItem["category"],
): ContentType {
  if (category === "film") return "MOVIE";
  if (category === "music") return "MUSIC";
  return "BOOK";
}

/**
 * Universal Explore → Work Detail Modal entry.
 * Saves ReturnContext + scroll via openWorkDetail; no route change.
 */
export function openExploreWorkDetail(
  workId: string,
  snapshot: WorkPreviewSnapshot,
) {
  openWorkDetail(workId, { snapshot });
}

/** Temporary debug — verify Explore opens API-backed Works. */
function debugExploreOpen(payload: {
  id: string;
  source: string | undefined;
  coverUrl: string;
  description: string;
  externalId: string | undefined;
}) {
  // eslint-disable-next-line no-console
  console.debug("[Explore open]", {
    id: payload.id,
    source: payload.source,
    coverUrl: payload.coverUrl,
    description: payload.description,
    externalId: payload.externalId,
  });
}

/** Open Work Detail from a catalog Content card. */
export function openExploreContent(content: Content) {
  const imported = resolveCanonicalWork({
    workId: content.id,
    title: content.title,
    creator: content.creator,
    type: content.type,
  });
  const workId =
    imported && isApiBackedSource(imported.source) ? imported.id : content.id;
  const coverUrl = resolveCanonicalCoverUrl({
    workId,
    title: content.title,
    creator: content.creator,
    type: content.type,
    catalogCover: content.cover,
  });
  const description = cleanDescription(
    imported?.description || content.description,
  );
  const source = imported?.source ?? content.source;
  const externalId = imported?.externalId;

  debugExploreOpen({
    id: workId,
    source,
    coverUrl,
    description,
    externalId,
  });
  // eslint-disable-next-line no-console
  console.info(
    "[canonical-work:explore]",
    toCanonicalWorkLog("explore", content.id, {
      workId: content.id,
      title: content.title,
      creator: content.creator,
      type: content.type,
    }),
  );

  openExploreWorkDetail(workId, {
    title: imported?.title ?? content.title,
    creator: imported?.creator ?? content.creator,
    type: content.type,
    cover: coverUrl,
    tags: (imported?.genres ?? content.tags).slice(0, 4),
    description,
  });
}

/** Open Work Detail from a discovery carousel item (Trending / Category). */
export function openExploreDiscoveryItem(item: ExploreDiscoveryItem) {
  const workId = item.contentId ?? item.id;
  const resolved = resolveCanonicalWork({
    workId,
    title: item.title,
    creator: item.creator,
    type: categoryToContentType(item.category),
  });
  const resolvedId =
    resolved && isApiBackedSource(resolved.source) ? resolved.id : workId;
  const coverUrl = resolveCanonicalCoverUrl({
    workId: resolvedId,
    title: item.title,
    creator: item.creator,
    type: categoryToContentType(item.category),
    libraryCover: item.coverUrl,
    catalogCover: item.cover,
  });
  const description = cleanDescription(
    resolved?.description || item.reason,
  );

  debugExploreOpen({
    id: resolvedId,
    source: resolved?.source ?? item.workSource ?? item.source,
    coverUrl,
    description,
    externalId: resolved?.externalId,
  });
  // eslint-disable-next-line no-console
  console.info(
    "[canonical-work:explore]",
    toCanonicalWorkLog("explore", workId, {
      workId,
      title: item.title,
      creator: item.creator,
      type: categoryToContentType(item.category),
    }),
  );

  openExploreWorkDetail(resolvedId, {
    title: resolved?.title ?? item.title,
    creator: resolved?.creator ?? item.creator,
    type: categoryToContentType(item.category),
    cover: coverUrl,
    description,
  });
}
