"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MediaIcon } from "@/components/dashboard/mood-bubble-shared";
import { LibraryArchiveCover } from "@/components/library/library-archive-cover";
import { LibraryMoodTags } from "@/components/library/library-mood-tags";
import { LibraryPanelShell } from "@/components/library/library-panel-shell";
import {
  formatRecommendationWhy,
  formatTasteAlignment,
} from "@/components/library/library-recommendation-utils";
import { deriveLibraryMoodTags } from "@/components/library/library-visual-utils";
import { WorkStatusActions } from "@/components/work-status-actions";
import type { Recommendation } from "@/lib/ai/recommendation-engine";
import {
  getContentByMediaKey,
} from "@/lib/content/bubble-content-bridge";
import { getContentById } from "@/lib/content/content-data";
import { CONTENT_TYPE_LABELS, CREATOR_LABELS } from "@/lib/content/constants";
import {
  closeAllDetails,
  closeDetail,
  openJournalQuickLog,
  type WorkPreviewSnapshot,
} from "@/lib/detail/detail-overlay-store";
import { useLibraryItems } from "@/lib/library/use-library-items";
import { navigateToWorkDetail } from "@/lib/navigation/navigate-to-work";
import { cleanDescription } from "@/lib/work/clean-description";
import { resolveCoverUrl } from "@/lib/work/cover-url";
import {
  getImportedWorkById,
  useImportedWorkMap,
} from "@/lib/work/imported-work-catalog";
import { resolveWorkRouteId } from "@/lib/work/work-route";

type WorkPreviewModalProps = {
  workId: string | null;
  recommendation?: Recommendation | null;
  snapshot?: WorkPreviewSnapshot | null;
  onClose?: () => void;
  lockScroll?: boolean;
  zIndex?: number;
  showExploreMore?: boolean;
};

/**
 * Level-1 lightweight work preview.
 * View Details navigates to /work/[id] (Level-2 full archive page).
 */
export function WorkPreviewModal({
  workId,
  recommendation = null,
  snapshot = null,
  onClose = closeDetail,
  lockScroll = false,
  zIndex = 70,
  showExploreMore = Boolean(recommendation),
}: WorkPreviewModalProps) {
  const router = useRouter();
  const resolvedId = useMemo(
    () => (workId ? resolveWorkRouteId(workId) : null),
    [workId],
  );
  const { getItemByKey } = useLibraryItems();
  const importedMap = useImportedWorkMap();
  const libraryItem = resolvedId ? getItemByKey(resolvedId) : null;
  const catalog = resolvedId
    ? (getContentById(resolvedId) ?? getContentByMediaKey(resolvedId))
    : null;
  const imported = resolvedId
    ? (importedMap[resolvedId] ?? getImportedWorkById(resolvedId))
    : null;

  const title =
    recommendation?.title ??
    libraryItem?.title ??
    catalog?.title ??
    imported?.title ??
    snapshot?.title ??
    "Work preview";
  const creator =
    recommendation?.creator ??
    libraryItem?.creator ??
    catalog?.creator ??
    imported?.creator ??
    snapshot?.creator ??
    "";
  const type =
    recommendation?.type ??
    libraryItem?.type ??
    catalog?.type ??
    (imported ? "BOOK" : undefined) ??
    snapshot?.type ??
    "BOOK";
  // Field used by LibraryArchiveCover is `cover` (prop), fed by Work.coverUrl.
  const cover = resolveCoverUrl(
    imported?.coverUrl,
    snapshot?.cover,
    recommendation?.cover,
    libraryItem?.cover,
    catalog?.cover,
  );
  const description = cleanDescription(
    catalog?.description ||
      imported?.description ||
      snapshot?.description ||
      libraryItem?.shortReview ||
      libraryItem?.notes,
  );
  const moodTags =
    recommendation?.tags?.slice(0, 4) ??
    (libraryItem ? deriveLibraryMoodTags(libraryItem) : null) ??
    catalog?.tags?.slice(0, 4) ??
    imported?.genres?.slice(0, 4) ??
    snapshot?.tags?.slice(0, 4) ??
    [];

  const goToFullDetails = () => {
    if (!resolvedId) return;
    navigateToWorkDetail(router, resolvedId);
  };

  return (
    <LibraryPanelShell
      open={Boolean(workId)}
      title={title}
      onClose={onClose}
      wide
      lockScroll={lockScroll}
      zIndex={zIndex}
    >
      <div className="md:flex md:gap-7 md:pr-4">
        <div className="mx-auto w-[150px] shrink-0 md:mx-0 md:w-[170px]">
          <LibraryArchiveCover
            cover={cover}
            title={title}
            className="rounded-[14px] shadow-none"
          />
        </div>

        <div className="mt-5 min-w-0 flex-1 md:mt-0">
          <div className="flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.16em] text-white/40">
            <MediaIcon type={type} className="size-3.5" style={{ opacity: 0.7 }} />
            <span>{CONTENT_TYPE_LABELS[type]}</span>
          </div>

          <h2 className="mt-2 font-display text-[24px] font-semibold leading-tight tracking-tight text-white/94 md:text-[28px]">
            {title}
          </h2>
          <p className="mt-1.5 text-[14px] text-white/48">
            <span className="text-white/32">{CREATOR_LABELS[type]} · </span>
            {creator}
          </p>

          {recommendation ? (
            <div className="mt-4 space-y-3">
              <div>
                <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/32">
                  Why AI recommends this
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">
                  {formatRecommendationWhy(recommendation)}
                </p>
              </div>
              <div>
                <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/32">
                  Similar to your taste
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/52">
                  {formatTasteAlignment(recommendation)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-white/55">
              {description}
            </p>
          )}

          <div className="mt-4">
            <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/32">
              Mood keywords
            </p>
            <LibraryMoodTags tags={moodTags} className="mt-2" />
          </div>

          {!recommendation ? null : (
            <p className="mt-4 text-[13px] leading-relaxed text-white/48">
              {description}
            </p>
          )}

          <div className="mt-6 space-y-3">
            {resolvedId ? (
              <WorkStatusActions
                workId={resolvedId}
                type={type}
                title={title}
                creator={creator}
                cover={cover}
                variant="panel"
              />
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!resolvedId) return;
                  openJournalQuickLog(resolvedId, {
                    snapshot: {
                      title,
                      creator,
                      type,
                      cover,
                      tags: moodTags,
                      description,
                    },
                  });
                }}
                className="rounded-full border border-white/14 px-5 py-2.5 text-sm text-white/72"
              >
                + Add to Journal
              </button>
              <button
                type="button"
                onClick={goToFullDetails}
                className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/48 transition-colors hover:text-white/70"
              >
                View Details →
              </button>
            </div>
          </div>

          {showExploreMore ? (
            <div className="mt-5">
              <Link
                href="/explore"
                onClick={() => closeAllDetails()}
                className="text-[13px] text-white/40 transition-colors hover:text-white/68"
              >
                Explore More Recommendations →
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </LibraryPanelShell>
  );
}
