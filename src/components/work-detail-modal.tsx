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
import { useLibraryItems } from "@/lib/library/use-library-items";
import { resolveWorkRouteId } from "@/lib/work/work-route";

type WorkDetailModalProps = {
  workId: string | null;
  onClose: () => void;
  /** Overlay stack manages body lock + scroll restore. */
  lockScroll?: boolean;
  zIndex?: number;
};

function CatalogDetailBody({
  workId,
  onClose,
}: {
  workId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const content =
    getContentById(workId) ?? getContentByMediaKey(workId) ?? null;

  if (!content) {
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
          cover={content.cover}
          title={content.title}
          className="rounded-[16px]"
        />
      </div>

      <div className="mt-5 min-w-0 flex-1 md:mt-0">
        <div className="flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.16em] text-white/40">
          <MediaIcon
            type={content.type}
            className="size-3.5"
            style={{ opacity: 0.7 }}
          />
          <span>{CONTENT_TYPE_LABELS[content.type]}</span>
        </div>

        <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight text-white/94 md:text-[30px]">
          {content.title}
        </h2>
        <p className="mt-1.5 text-[14px] text-white/48">
          <span className="text-white/32">
            {CREATOR_LABELS[content.type]} ·{" "}
          </span>
          {content.creator}
        </p>

        <LibraryMoodTags tags={content.tags.slice(0, 4)} className="mt-4" />

        <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-white/55">
          {content.description}
        </p>

        <div className="mt-6 space-y-3">
          <WorkStatusActions
            workId={content.id}
            type={content.type}
            title={content.title}
            creator={content.creator}
            cover={content.cover}
            variant="panel"
          />
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/calendar");
            }}
            className="rounded-full border border-white/14 px-5 py-2.5 text-sm text-white/72"
          >
            + Add to Journal
          </button>
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
  lockScroll = false,
  zIndex = 70,
}: WorkDetailModalProps) {
  const resolvedId = useMemo(
    () => (workId ? resolveWorkRouteId(workId) : null),
    [workId],
  );
  const { getItemByKey, allItems } = useLibraryItems();

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

  const title =
    libraryItem?.title ??
    (resolvedId
      ? (getContentById(resolvedId) ?? getContentByMediaKey(resolvedId))?.title
      : undefined) ??
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
        libraryItem ? (
          <LibraryDetailContent
            key={libraryItem.mediaKey}
            item={libraryItem}
            onClose={onClose}
          />
        ) : (
          <CatalogDetailBody
            key={resolvedId}
            workId={resolvedId}
            onClose={onClose}
          />
        )
      ) : null}
    </LibraryPanelShell>
  );
}
