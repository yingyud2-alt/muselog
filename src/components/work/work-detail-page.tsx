"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { LibraryArchiveCover } from "@/components/library/library-archive-cover";
import { LibraryMoodTags } from "@/components/library/library-mood-tags";
import { deriveLibraryMoodTags } from "@/components/library/library-visual-utils";
import { WorkStatusActions } from "@/components/work-status-actions";
import {
  buildJournalRecords,
  formatArchiveDate,
  formatDuration,
  personalSentence,
  tasteInsightPlaceholder,
} from "@/components/work/work-detail-utils";
import { useJournalEntries } from "@/lib/calendar/journal-store";
import { useMemoryPhotos } from "@/lib/calendar/memory-photos-store";
import {
  getJourneyColor,
  normalizeJourneyColor,
} from "@/lib/calendar/journey-utils";
import { useMuseRecommendations } from "@/lib/ai/use-muse-recommendations";
import {
  resolveJournalItemId,
} from "@/lib/content/bubble-content-bridge";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import { useUserMediaStateMap } from "@/lib/content/user-media-state";
import { getLibraryLabels } from "@/lib/library/library-labels";
import { useLibraryItems } from "@/lib/library/use-library-items";
import {
  getSavedReturnLabel,
  navigateToWorkDetail,
  returnToPreviousContext,
} from "@/lib/navigation/navigate-to-work";
import {
  toContentType,
  toUserMediaStatus,
} from "@/lib/work/work-adapters";
import { useWorks } from "@/lib/work/use-works";
import { resolveWorkRouteId } from "@/lib/work/work-route";
import {
  JOURNEY_COLOR_SWATCHES,
  TYPE_JOURNEY_COLORS,
  type JourneyColor,
} from "@/types/media";
import { cn } from "@/lib/utils";

type WorkDetailPageProps = {
  id: string;
};

function statusLabelFor(
  type: "BOOK" | "MOVIE" | "MUSIC",
  status: "WANT" | "ONGOING" | "FINISHED" | "DROPPED" | undefined,
): string {
  const labels = getLibraryLabels(type);
  if (status === "FINISHED") return labels.finished;
  if (status === "ONGOING") return labels.ongoing;
  if (status === "WANT") return labels.want;
  if (status === "DROPPED") return labels.dropped;
  return "Unarchived";
}

export function WorkDetailPage({ id: rawId }: WorkDetailPageProps) {
  const router = useRouter();
  const id = useMemo(() => resolveWorkRouteId(rawId), [rawId]);
  const { getItemByKey } = useLibraryItems();
  const { getWork } = useWorks();
  const { entries } = useJournalEntries();
  const stateMap = useUserMediaStateMap();
  const recommendations = useMuseRecommendations(8);
  const returnLabel = getSavedReturnLabel();

  const work = useMemo(() => getWork(id), [getWork, id]);
  const item = useMemo(() => getItemByKey(id), [getItemByKey, id]);

  const journalId = resolveJournalItemId(item?.mediaKey ?? id);
  const journalEntry =
    entries.find((entry) => entry.id === journalId) ?? null;
  const { photos } = useMemoryPhotos(journalEntry?.id ?? null);

  const title = work?.title ?? null;
  const creator = work?.creator ?? "";
  const cover = work?.coverUrl ?? "from-slate-800 via-slate-900 to-black";
  const type = work ? toContentType(work.type) : null;
  const status = work
    ? toUserMediaStatus(work.userStatus ?? work.userState)
    : item?.status;

  const moodTags = useMemo(() => {
    if (work?.moodTags.length) return work.moodTags;
    if (item) return deriveLibraryMoodTags(item);
    return work?.genres.slice(0, 4) ?? [];
  }, [work, item]);

  const memoryColor: JourneyColor = useMemo(() => {
    const fromState = stateMap[item?.mediaKey ?? id]?.journeyColor;
    if (fromState) {
      return normalizeJourneyColor(
        fromState,
        TYPE_JOURNEY_COLORS[
          type === "MOVIE" ? "movie" : type === "MUSIC" ? "music" : "book"
        ],
      );
    }
    if (journalEntry) return getJourneyColor(journalEntry);
    return TYPE_JOURNEY_COLORS[
      type === "MOVIE" ? "movie" : type === "MUSIC" ? "music" : "book"
    ];
  }, [stateMap, item, id, journalEntry, type]);

  const startDate =
    work?.timeline.startDate ?? item?.startDate ?? journalEntry?.startDate;
  const endDate =
    work?.timeline.endDate ?? item?.endDate ?? journalEntry?.endDate;
  const duration = formatDuration(startDate, endDate);

  const records = useMemo(
    () => buildJournalRecords(journalEntry, photos, item),
    [journalEntry, photos, item],
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const related = useMemo(
    () =>
      recommendations
        .filter((rec) => rec.id !== id && rec.id !== item?.mediaKey)
        .slice(0, 5),
    [recommendations, id, item?.mediaKey],
  );

  const insight = useMemo(
    () =>
      tasteInsightPlaceholder(
        work?.aiInsights?.themes?.length
          ? work.aiInsights.themes
          : moodTags.length
            ? moodTags
            : work?.genres ?? [],
      ),
    [moodTags, work],
  );

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
      <div className="mx-auto max-w-6xl px-5 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-8 md:px-10 md:pb-20 md:pt-12">
        {/* Hero */}
        <section className="grid gap-8 md:grid-cols-[240px_minmax(0,1fr)] md:gap-12 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-[240px] md:mx-0 md:max-w-none">
            <LibraryArchiveCover
              cover={cover}
              title={title}
              className="rounded-[18px] shadow-none ring-1 ring-white/10"
            />
          </div>

          <div className="min-w-0 self-center">
            <p className="font-label text-[11px] uppercase tracking-[0.18em] text-white/38">
              {CONTENT_TYPE_LABELS[type]}
            </p>
            <h1 className="mt-3 font-display text-[32px] font-semibold leading-tight tracking-tight text-white/94 md:text-[42px]">
              {title}
            </h1>
            <p className="mt-2 text-[16px] text-white/48">{creator}</p>

            <p className="mt-5 font-label text-[11px] uppercase tracking-[0.14em] text-white/32">
              Status
            </p>
            <p className="mt-1.5 text-[15px] text-white/78">
              {statusLabelFor(type, status)}
            </p>

            <p className="mt-6 max-w-xl font-quote text-[16px] leading-relaxed text-white/58">
              {work?.userNotes?.trim() ||
                work?.description?.trim() ||
                personalSentence(item, null)}
            </p>
          </div>
        </section>

        {/* My Memory */}
        <section className="mt-14 border-t border-white/[0.07] pt-10 md:mt-16">
          <h2 className="font-display text-[22px] font-semibold tracking-tight text-white/90">
            My Memory
          </h2>

          <div className="mt-6 space-y-6">
            <div>
              <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/32">
                Mood keywords
              </p>
              <LibraryMoodTags tags={moodTags} className="mt-3" />
            </div>

            <div>
              <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/32">
                Memory color
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span
                  className="size-3.5 rounded-full border border-white/20"
                  style={{ backgroundColor: JOURNEY_COLOR_SWATCHES[memoryColor] }}
                  aria-hidden="true"
                />
                <span className="text-[13px] capitalize text-white/55">
                  {memoryColor}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="mt-12 border-t border-white/[0.07] pt-10">
          <h2 className="font-display text-[22px] font-semibold tracking-tight text-white/90">
            Timeline
          </h2>

          <div className="mt-8">
            <div className="relative mx-auto max-w-2xl">
              <div className="absolute left-0 right-0 top-[7px] h-px bg-white/12" />
              <div className="relative grid grid-cols-3 gap-3">
                {[
                  { label: "Started", value: formatArchiveDate(startDate) },
                  { label: "Finished", value: formatArchiveDate(endDate) },
                  { label: "Duration", value: duration },
                ].map((point) => (
                  <div key={point.label} className="flex flex-col items-center text-center">
                    <span className="relative z-[1] size-3.5 rounded-full border border-white/25 bg-[#090A0F]" />
                    <p className="mt-3 font-label text-[10px] uppercase tracking-[0.14em] text-white/32">
                      {point.label}
                    </p>
                    <p className="mt-1 text-[13px] text-white/72">{point.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Journal Records */}
        <section className="mt-12 border-t border-white/[0.07] pt-10">
          <h2 className="font-display text-[22px] font-semibold tracking-tight text-white/90">
            Journal Records
          </h2>

          {records.length === 0 ? (
            <p className="mt-5 text-[14px] text-white/40">
              No journal records yet for this work.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {records.map((record) => {
                const open = expandedId === record.id;
                return (
                  <li key={record.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId((current) =>
                          current === record.id ? null : record.id,
                        )
                      }
                      className={cn(
                        "flex w-full items-start gap-4 border border-white/[0.08] bg-transparent px-4 py-4 text-left",
                        "rounded-[14px] transition-colors hover:border-white/18",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15",
                      )}
                    >
                      {record.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={record.photo}
                          alt=""
                          className="size-14 shrink-0 rounded-[8px] object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <span className="size-14 shrink-0 rounded-[8px] border border-white/10 bg-white/[0.03]" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="font-label text-[11px] tracking-[0.08em] text-white/38">
                          {formatArchiveDate(record.date)}
                        </span>
                        <span
                          className={cn(
                            "mt-1.5 block text-[14px] leading-relaxed text-white/68",
                            !open && "line-clamp-2",
                          )}
                        >
                          &ldquo;{record.reflection}&rdquo;
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* AI Reflection */}
        <section className="mt-12 border-t border-white/[0.07] pt-10">
          <h2 className="font-display text-[22px] font-semibold tracking-tight text-white/90">
            How this work shaped your taste
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/58">
            {insight.summary}
          </p>
          <dl className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { label: "Emotional pattern", value: insight.emotional },
              { label: "Narrative preference", value: insight.narrative },
              { label: "Aesthetic preference", value: insight.aesthetic },
            ].map((row) => (
              <div key={row.label}>
                <dt className="font-label text-[10px] uppercase tracking-[0.14em] text-white/32">
                  {row.label}
                </dt>
                <dd className="mt-2 text-[13px] leading-relaxed text-white/55">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Related Works */}
        {related.length > 0 ? (
          <section className="mt-12 border-t border-white/[0.07] pt-10">
            <h2 className="font-display text-[22px] font-semibold tracking-tight text-white/90">
              Related to your taste
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rec) => (
                <li key={rec.id}>
                  <button
                    type="button"
                    onClick={() => navigateToWorkDetail(router, rec.id)}
                    className="flex w-full gap-3 rounded-[14px] border border-white/[0.07] p-3 text-left transition-colors hover:border-white/16"
                  >
                    <LibraryArchiveCover
                      cover={rec.cover}
                      title={rec.title}
                      className="w-[56px] shrink-0 rounded-[8px] shadow-none"
                    />
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-[14px] font-medium text-white/86">
                        {rec.title}
                      </span>
                      <span className="mt-1.5 block text-[12px] leading-relaxed text-white/42">
                        {rec.becauseOf
                          ? `Because you enjoyed ${rec.becauseOf}.`
                          : rec.reason}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Actions */}
        <section className="mt-14 space-y-4 border-t border-white/[0.07] pt-8">
          <WorkStatusActions
            workId={id}
            type={type}
            title={title}
            creator={creator}
            cover={cover}
            variant="panel"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/calendar")}
              className="rounded-full border border-white/18 px-5 py-2.5 text-sm text-white/72 transition-colors hover:border-white/32 hover:text-white/90"
            >
              Add Journal
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
