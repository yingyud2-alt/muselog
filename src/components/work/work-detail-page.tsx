"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { LibraryArchiveCover } from "@/components/library/library-archive-cover";
import { deriveLibraryMoodTags } from "@/components/library/library-visual-utils";
import { WorkCommunitySection } from "@/components/work/work-community-section";
import { WorkEnrichmentSections } from "@/components/work/work-enrichment-sections";
import { WorkYourJourneySection } from "@/components/work/work-your-journey-section";
import { WorkStatusActions } from "@/components/work-status-actions";
import { useJournalEntries } from "@/lib/calendar/journal-store";
import { useMemoryPhotos } from "@/lib/calendar/memory-photos-store";
import { resolveJournalItemId } from "@/lib/content/bubble-content-bridge";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import { useUserMediaStateMap } from "@/lib/content/user-media-state";
import { openJournalQuickLog } from "@/lib/detail/detail-overlay-store";
import { useLibraryItems } from "@/lib/library/use-library-items";
import {
  getSavedReturnLabel,
  returnToPreviousContext,
} from "@/lib/navigation/navigate-to-work";
import { generateWorkEnrichment } from "@/services/ai/work-enrichment-service";
import { resolveCoverUrl } from "@/lib/work/cover-url";
import {
  getImportedWorkById,
  useImportedWorkMap,
} from "@/lib/work/imported-work-catalog";
import { toContentType } from "@/lib/work/work-adapters";
import { useWorks } from "@/lib/work/use-works";
import { resolveWorkRouteId } from "@/lib/work/work-route";
import type { Work } from "@/types/work";
import type { WorkEnrichment } from "@/types/work-enrichment";

type WorkDetailPageProps = {
  id: string;
};

function formatHeroRating(value: number, scale: number): string {
  const display =
    Number.isInteger(value) && scale >= 10
      ? value.toFixed(1)
      : Number.isInteger(value)
        ? String(value)
        : value.toFixed(1);
  return `${display} / ${scale}`;
}

/**
 * Work Detail — cultural archive page.
 * Hierarchy only (spacing / rhythm / section order). Data layer unchanged.
 */
export function WorkDetailPage({ id: rawId }: WorkDetailPageProps) {
  const router = useRouter();
  const id = useMemo(() => resolveWorkRouteId(rawId), [rawId]);
  const { getItemByKey } = useLibraryItems();
  const { getWork } = useWorks();
  const importedMap = useImportedWorkMap();
  const { entries } = useJournalEntries();
  const stateMap = useUserMediaStateMap();
  const returnLabel = getSavedReturnLabel();

  const work = useMemo((): Work | null => {
    const resolved = getWork(id);
    if (resolved?.source === "open_library" || resolved?.externalId) {
      return resolved;
    }
    const imported =
      importedMap[id] ?? getImportedWorkById(id) ?? null;
    if (imported) {
      return { ...imported, id: resolved?.id ?? id };
    }
    return resolved;
  }, [getWork, id, importedMap]);

  const item = useMemo(() => getItemByKey(id), [getItemByKey, id]);

  const mediaKey = item?.mediaKey ?? id;
  const userState = stateMap[mediaKey];
  const journalId = resolveJournalItemId(mediaKey);
  const journalEntry =
    entries.find((entry) => entry.id === journalId) ?? null;
  const { photos } = useMemoryPhotos(journalEntry?.id ?? null);

  const title = work?.title ?? null;
  const creator = work?.creator ?? "";
  const cover = resolveCoverUrl(work?.coverUrl, item?.cover);
  const type = work ? toContentType(work.type) : null;
  const storedStatus = userState?.status;
  const status =
    item?.status ??
    (storedStatus && storedStatus !== "NONE" ? storedStatus : undefined);

  const personalMoodTags = useMemo(() => {
    if (journalEntry?.tags?.length) return journalEntry.tags;
    if (work?.moodTags.length) return work.moodTags;
    if (item) return deriveLibraryMoodTags(item);
    return [];
  }, [journalEntry, work, item]);

  const communityRatings = useMemo(() => {
    if (work?.externalRatings && work.externalRatings.length > 0) {
      return work.externalRatings;
    }
    const average = work?.metadata?.ratingsAverage;
    const count = work?.metadata?.ratingsCount;
    if (typeof average === "number" && Number.isFinite(average) && average > 0) {
      return [
        {
          source: work?.source ?? "open_library",
          value: average,
          scale: 5,
          count: typeof count === "number" ? count : undefined,
        },
      ];
    }
    return work?.externalRatings;
  }, [work]);

  const primaryRating = communityRatings?.[0];

  const enrichment = useMemo((): WorkEnrichment | null => {
    if (!work) return null;
    return work.enrichment ?? generateWorkEnrichment(work);
  }, [work]);

  useEffect(() => {
    if (!enrichment) return;
    // eslint-disable-next-line no-console
    console.log("WORK ENRICHMENT", {
      summary: enrichment.summary,
      whatToExpect: enrichment.whatToExpect,
      guide: enrichment.guide,
      themes: enrichment.themes,
    });
  }, [enrichment]);

  const startDate =
    userState?.startDate ??
    work?.timeline.startDate ??
    item?.startDate ??
    journalEntry?.startDate;
  const endDate =
    userState?.endDate ??
    work?.timeline.endDate ??
    item?.endDate ??
    journalEntry?.endDate;
  const rating =
    userState?.rating ??
    item?.rating ??
    (journalEntry?.rating && journalEntry.rating > 0
      ? journalEntry.rating
      : undefined) ??
    work?.rating;

  if (!title || !type) {
    return (
      <main className="min-h-[100svh] bg-[#090A0F] px-6 py-16 text-white md:min-h-screen">
        <div className="mx-auto max-w-3xl">
          <p className="font-label text-[11px] uppercase tracking-[0.16em] text-white/35">
            Archive
          </p>
          <h1 className="mt-3 font-display text-2xl text-white/88">
            This work is not in your archive yet.
          </h1>
          <button
            type="button"
            onClick={() => returnToPreviousContext(router)}
            className="mt-6 inline-flex rounded-full border border-white/18 px-5 py-2.5 text-sm text-white/70 transition-colors hover:border-white/32 hover:text-white/88"
          >
            {returnLabel}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] overflow-x-hidden bg-[#090A0F] text-white md:min-h-screen">
      <div className="mx-auto max-w-5xl px-5 pb-[calc(env(safe-area-inset-bottom)+112px)] pt-10 md:px-10 md:pb-24 md:pt-16">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="grid gap-10 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] md:gap-14 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-16">
          <div className="mx-auto w-full max-w-[260px] md:mx-0 md:max-w-none">
            <LibraryArchiveCover
              cover={cover}
              title={title}
              className="rounded-[14px] shadow-none ring-1 ring-white/[0.08]"
            />
          </div>

          <div className="min-w-0 self-center">
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-white/32">
              {CONTENT_TYPE_LABELS[type]}
            </p>
            <h1 className="mt-4 font-display text-[34px] font-medium leading-[1.12] tracking-tight text-white/94 md:text-[44px]">
              {title}
            </h1>
            <p className="mt-3 text-[16px] text-white/44">{creator}</p>

            {primaryRating ? (
              <p className="mt-8 font-display text-[20px] tabular-nums text-white/78">
                {formatHeroRating(primaryRating.value, primaryRating.scale)}
                <span className="ml-3 font-label text-[10px] uppercase tracking-[0.14em] text-white/28">
                  {primaryRating.source === "open_library"
                    ? "Open Library"
                    : primaryRating.source}
                </span>
              </p>
            ) : null}

            {/* Existing status buttons — unchanged component */}
            <div className="mt-10">
              <WorkStatusActions
                workId={id}
                type={type}
                title={title}
                creator={creator}
                cover={cover}
                variant="panel"
              />
            </div>
          </div>
        </section>

        {/* ── About → What to expect → Themes → Guide ──────── */}
        {enrichment ? (
          <WorkEnrichmentSections
            enrichment={enrichment}
            description={work?.description}
          />
        ) : null}

        {/* ── Community rating ─────────────────────────────── */}
        <WorkCommunitySection ratings={communityRatings} />

        {/* ── My Journey ───────────────────────────────────── */}
        <WorkYourJourneySection
          type={type}
          status={status}
          startDate={startDate}
          endDate={endDate}
          rating={rating}
          moodTags={personalMoodTags}
          journalEntry={journalEntry}
          photos={photos}
          libraryItem={item}
        />

        {/* ── Quiet footer actions ─────────────────────────── */}
        <section className="mt-20 border-t border-white/[0.06] pt-10">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                openJournalQuickLog(id, {
                  snapshot: {
                    title,
                    creator,
                    type,
                    cover,
                  },
                })
              }
              className="rounded-full border border-white/18 px-5 py-2.5 text-sm text-white/72 transition-colors hover:border-white/32 hover:text-white/90"
            >
              Add to Journal
            </button>
            <button
              type="button"
              onClick={() => returnToPreviousContext(router)}
              className="rounded-full border border-white/18 px-5 py-2.5 text-sm text-white/72 transition-colors hover:border-white/32 hover:text-white/90"
            >
              {returnLabel}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
