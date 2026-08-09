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
import { cleanDescription } from "@/lib/work/clean-description";
import {
  getImportedWorkById,
  useImportedWorkMap,
} from "@/lib/work/imported-work-catalog";
import {
  resolveCanonicalCoverUrl,
  resolveCanonicalWork,
  toCanonicalWorkLog,
} from "@/lib/work/resolve-canonical-work";
import { toContentType } from "@/lib/work/work-adapters";
import { resolveWorkRouteId } from "@/lib/work/work-route";
import type { ExternalRating, Work } from "@/types/work";

type WorkDetailModalProps = {
  workId: string | null;
  onClose: () => void;
  snapshot?: WorkPreviewSnapshot | null;
  /** Overlay stack manages body lock + scroll restore. */
  lockScroll?: boolean;
  zIndex?: number;
};

function formatReleaseYear(releaseDate: string | undefined): string | null {
  const raw = releaseDate?.trim();
  if (!raw) return null;
  const year = raw.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : raw;
}

function formatProviderLabel(source: string | undefined): string | null {
  const key = source?.trim().toLowerCase();
  if (!key) return null;
  if (key === "open_library") return "Open Library";
  if (key === "tmdb") return "TMDB";
  if (key === "spotify") return "Spotify";
  if (key === "google_books") return "Google Books";
  if (key === "douban") return "Douban";
  if (key === "manual") return null;
  return source!.charAt(0).toUpperCase() + source!.slice(1);
}

function formatExternalRating(rating: ExternalRating | undefined): string | null {
  if (!rating) return null;
  if (!Number.isFinite(rating.value) || !Number.isFinite(rating.scale)) {
    return null;
  }
  if (rating.scale <= 0) return null;
  const value =
    Number.isInteger(rating.value) && rating.scale >= 10
      ? rating.value.toFixed(1)
      : Number.isInteger(rating.value)
        ? String(rating.value)
        : String(Math.round(rating.value * 10) / 10);
  return `${value}/${rating.scale}`;
}

function readPositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  }
  return null;
}

/** Compact metadata chips from existing Work fields — omit empties. */
function buildWorkMetadataParts(work: Work | null | undefined): string[] {
  if (!work) return [];

  const parts: string[] = [];
  const year = formatReleaseYear(work.releaseDate);
  if (year) parts.push(year);

  const provider = formatProviderLabel(work.source);
  if (provider) parts.push(provider);

  const rating = formatExternalRating(work.externalRatings?.[0]);
  if (rating) parts.push(rating);

  const pages = readPositiveInt(work.metadata?.pages);
  if (pages != null) parts.push(`${pages} pages`);

  const runtime = readPositiveInt(work.metadata?.runtime);
  if (runtime != null) parts.push(`${runtime} min`);

  return parts;
}

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
  // Canonical API Work first; legacy catalog only as fallback.
  const catalogHint =
    getContentById(workId) ?? getContentByMediaKey(workId) ?? null;
  const imported =
    resolveCanonicalWork({
      workId,
      title: catalogHint?.title ?? snapshot?.title,
      creator: catalogHint?.creator ?? snapshot?.creator,
      type: catalogHint?.type ?? snapshot?.type,
    }) ??
    importedMap[workId] ??
    getImportedWorkById(workId);
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
  const cover = resolveCanonicalCoverUrl({
    workId,
    title: title ?? undefined,
    creator,
    type,
    libraryCover: snapshot?.cover,
    catalogCover: content?.cover,
  });
  const description = cleanDescription(
    imported?.description ||
      snapshot?.description ||
      content?.description,
  );
  const tags =
    imported?.genres?.slice(0, 4) ??
    content?.tags?.slice(0, 4) ??
    snapshot?.tags?.slice(0, 4) ??
    [];
  const metadataParts = buildWorkMetadataParts(imported);

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

        {metadataParts.length > 0 ? (
          <p className="mt-2 text-[12px] leading-relaxed tracking-[0.02em] text-white/36">
            {metadataParts.join(" · ")}
          </p>
        ) : null}

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
    ? resolveCanonicalWork({
        workId: resolvedId,
        title: libraryItem?.title ?? snapshot?.title,
        creator: libraryItem?.creator ?? snapshot?.creator,
        type: libraryItem?.type ?? snapshot?.type,
      }) ??
      importedMap[resolvedId] ??
      getImportedWorkById(resolvedId)
    : null;
  const catalog = resolvedId
    ? (getContentById(resolvedId) ?? getContentByMediaKey(resolvedId))
    : null;

  // Explore often opens a library row that still has a gradient placeholder.
  // Overlay canonical API coverUrl / search snapshot before rendering.
  const libraryItemWithCover = useMemo(() => {
    if (!libraryItem) return null;
    const cover = resolveCanonicalCoverUrl({
      workId: resolvedId,
      title: libraryItem.title,
      creator: libraryItem.creator,
      type: libraryItem.type,
      libraryCover: libraryItem.cover,
      journalCover: snapshot?.cover,
      catalogCover: catalog?.cover,
    });
    if (process.env.NODE_ENV !== "production" && resolvedId) {
      // eslint-disable-next-line no-console
      console.info(
        "[canonical-work:work-detail]",
        toCanonicalWorkLog("work-detail", resolvedId, {
          workId: resolvedId,
          title: libraryItem.title,
          creator: libraryItem.creator,
          type: libraryItem.type,
        }),
      );
    }
    if (cover === libraryItem.cover) return libraryItem;
    return { ...libraryItem, cover };
  }, [catalog?.cover, libraryItem, resolvedId, snapshot?.cover]);

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
