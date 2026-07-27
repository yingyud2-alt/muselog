"use client";

import type { ExploreDiscoveryItem } from "@/lib/content/explore-discovery";
import type { Content, ContentType } from "@/lib/content/types";
import {
  openWorkDetail,
  type WorkPreviewSnapshot,
} from "@/lib/detail/detail-overlay-store";
import {
  findImportedWorkByTitle,
  getImportedWorkById,
} from "@/lib/work/imported-work-catalog";

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

/** Resolve imported Work: id → identity → title (creator language mismatch). */
function resolveImportedWork(
  id: string,
  title: string,
): ReturnType<typeof getImportedWorkById> {
  return (
    getImportedWorkById(id) ?? findImportedWorkByTitle(title)
  );
}

/** Open Work Detail from a catalog Content card. */
export function openExploreContent(content: Content) {
  const imported = resolveImportedWork(content.id, content.title);
  const coverUrl = imported?.coverUrl || content.cover;
  const description = imported?.description?.trim()
    ? imported.description
    : content.description;
  const source = imported?.source ?? content.source;
  const externalId = imported?.externalId;
  const workId = imported?.id ?? content.id;

  debugExploreOpen({
    id: workId,
    source,
    coverUrl,
    description,
    externalId,
  });

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
  const resolved = resolveImportedWork(workId, item.title);
  const resolvedId = resolved?.id ?? workId;
  const coverUrl = resolved?.coverUrl || item.coverUrl || item.cover;
  const description = resolved?.description?.trim()
    ? resolved.description
    : item.reason;

  debugExploreOpen({
    id: resolvedId,
    source: resolved?.source ?? item.workSource ?? item.source,
    coverUrl,
    description,
    externalId: resolved?.externalId,
  });

  openExploreWorkDetail(resolvedId, {
    title: resolved?.title ?? item.title,
    creator: resolved?.creator ?? item.creator,
    type: categoryToContentType(item.category),
    cover: coverUrl,
    description,
  });
}
