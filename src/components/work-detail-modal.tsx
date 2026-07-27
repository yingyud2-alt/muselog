"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { MediaIcon } from "@/components/dashboard/mood-bubble-shared";
import { LibraryArchiveCover } from "@/components/library/library-archive-cover";
import { LibraryDetailContent } from "@/components/library/library-detail";
import { LibraryMoodTags } from "@/components/library/library-mood-tags";
import { LibraryPanelShell } from "@/components/library/library-panel-shell";
import { WorkStatusActions } from "@/components/work-status-actions";
import {
  getContentByMediaKey,
  resolveJournalItemId,
} from "@/lib/content/bubble-content-bridge";
import { getContentById } from "@/lib/content/content-data";
import { CONTENT_TYPE_LABELS, CREATOR_LABELS } from "@/lib/content/constants";
import {
  openJournalQuickLog,
  type WorkPreviewSnapshot,
} from "@/lib/detail/detail-overlay-store";
import { useLibraryItems } from "@/lib/library/use-library-items";
import { navigateToWorkDetail } from "@/lib/navigation/navigate-to-work";
import { resolveCoverUrl } from "@/lib/work/cover-url";
import {
  findImportedWorkByTitle,
  getImportedWorkById,
  useImportedWorkMap,
} from "@/lib/work/imported-work-catalog";
import { toContentType } from "@/lib/work/work-adapters";
import { resolveWorkRouteId } from "@/lib/work/work-route";

type WorkDetailModalProps = {
  workId: string | null;
  onClose: () => void;
  snapshot?: WorkPreviewSnapshot | null;
  /** Overlay stack manages body lock + scroll restore. */
  lockScroll?: boolean;
  zIndex?: number;
};

function CatalogDetailBody({
  workId,
  snapshot = null,
}: {
  workId: string;
  onClose: () => void;
  snapshot?: WorkPreviewSnapshot | null;
}) {
  const router = useRouter();
  const importedMap = useImportedWorkMap();
  // Prefer imported Open Library Work over mock CONTENT_CATALOG.
  // Title fallback covers creator localization (Murakami vs 村上春樹).
  const catalogHint =
    getContentById(workId) ?? getContentByMediaKey(workId) ?? null;
  const imported =
    importedMap[workId] ??
    getImportedWorkById(workId) ??
    findImportedWorkByTitle(
      catalogHint?.title ?? snapshot?.title ?? "",
    );
  const content = catalogHint;

  const title =
    imported?.title ?? content?.title ?? snapshot?.title ?? null;
  const creator =
    imported?.creator ?? content?.creator ?? snapshot?.creator ?? "";
  const type =
    (imported ? toContentType(imported.type) : undefined) ??
    content?.type ??
    snapshot?.type ??
    "BOOK";
  // Same resolver as Library / full detail — prefer Work.coverUrl over gradients.
  const cover = resolveCoverUrl(
    imported?.coverUrl,
    snapshot?.cover,
    content?.cover,
  );
  const description =
    (imported?.description?.trim()
      ? imported.description
      : undefined) ??
    snapshot?.description ??
    content?.description ??
    "A quiet work waiting in your cultural orbit.";
  const tags =
    imported?.genres?.slice(0, 4) ??
    content?.tags?.slice(0, 4) ??
    snapshot?.tags?.slice(0, 4) ??
    [];

  if (!title) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-white/50">This work could not be found.</p>
      </div>
    );
  }

  return (
    <div className="md:flex md:gap-8 md:pr-6">
      <div className="mx-auto w-[180px] shrink-0 md:mx-0 md:w-[210px]">
        <LibraryArchiveCover
          cover={cover}
          title={title}
          className="rounded-[16px]"
        />
      </div>

      <div className="mt-5 min-w-0 flex-1 md:mt-0">
        <div className="flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.16em] text-white/40">
          <MediaIcon
            type={type}
            className="size-3.5"
            style={{ opacity: 0.7 }}
          />
          <span>{CONTENT_TYPE_LABELS[type]}</span>
        </div>

        <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight text-white/94 md:text-[30px]">
          {title}
        </h2>
        <p className="mt-1.5 text-[14px] text-white/48">
          <span className="text-white/32">
            {CREATOR_LABELS[type]} ·{" "}
          </span>
          {creator}
        </p>

        <LibraryMoodTags tags={tags} className="mt-4" />

        <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-white/55">
          {description}
        </p>

        <div className="mt-6 space-y-3">
          <WorkStatusActions
            workId={workId}
            type={type}
            title={title}
            creator={creator}
            cover={cover}
            variant="panel"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                openJournalQuickLog(workId, {
                  snapshot: {
                    title,
                    creator,
                    type,
                    cover,
                    tags,
                    description,
                  },
                })
              }
              className="rounded-full border border-white/14 px-5 py-2.5 text-sm text-white/72"
            >
              + Add to Journal
            </button>
            <button
              type="button"
              onClick={() => navigateToWorkDetail(router, workId)}
              className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/48 transition-colors hover:text-white/70"
            >
              View Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Unified work detail modal — overlay only, no route navigation.
 * Used by Home AI Picks, Library, Explore, and Journal.
 */
export function WorkDetailModal({
  workId,
  onClose,
  snapshot = null,
  lockScroll = false,
  zIndex = 70,
}: WorkDetailModalProps) {
  const resolvedId = useMemo(
    () => (workId ? resolveWorkRouteId(workId) : null),
    [workId],
  );
  const { getItemByKey, allItems } = useLibraryItems();
  const importedMap = useImportedWorkMap();

  const libraryItem = useMemo(() => {
    if (!resolvedId) return null;
    const byKey = getItemByKey(resolvedId);
    if (byKey) return byKey;
    return (
      allItems.find(
        (entry) =>
          entry.mediaKey === resolvedId ||
          entry.contentId === resolvedId ||
          resolveJournalItemId(entry.mediaKey) === resolvedId,
      ) ?? null
    );
  }, [allItems, getItemByKey, resolvedId]);

  const imported = resolvedId
    ? (importedMap[resolvedId] ?? getImportedWorkById(resolvedId))
    : null;
  const catalog = resolvedId
    ? (getContentById(resolvedId) ?? getContentByMediaKey(resolvedId))
    : null;

  // Explore often opens a library row that still has a gradient placeholder.
  // Overlay Open Library coverUrl / search snapshot before rendering.
  const libraryItemWithCover = useMemo(() => {
    if (!libraryItem) return null;
    const cover = resolveCoverUrl(
      imported?.coverUrl,
      snapshot?.cover,
      libraryItem.cover,
      catalog?.cover,
    );
    if (cover === libraryItem.cover) return libraryItem;
    return { ...libraryItem, cover };
  }, [catalog?.cover, imported?.coverUrl, libraryItem, snapshot?.cover]);

  const title =
    libraryItemWithCover?.title ??
    imported?.title ??
    catalog?.title ??
    snapshot?.title ??
    "Work detail";

  return (
    <LibraryPanelShell
      open={Boolean(workId)}
      title={title}
      onClose={onClose}
      wide
      lockScroll={lockScroll}
      zIndex={zIndex}
    >
      {resolvedId ? (
        libraryItemWithCover ? (
          <LibraryDetailContent
            key={libraryItemWithCover.mediaKey}
            item={libraryItemWithCover}
            onClose={onClose}
          />
        ) : (
          <CatalogDetailBody
            key={resolvedId}
            workId={resolvedId}
            onClose={onClose}
            snapshot={snapshot}
          />
        )
      ) : null}
    </LibraryPanelShell>
  );
}
