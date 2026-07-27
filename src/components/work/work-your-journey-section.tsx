"use client";

import { useMemo, useState } from "react";

import { LibraryMoodTags } from "@/components/library/library-mood-tags";
import {
  buildJournalRecords,
  formatArchiveDate,
  formatDuration,
  type WorkJournalRecord,
} from "@/components/work/work-detail-utils";
import { getLibraryLabels } from "@/lib/library/library-labels";
import type { LibraryItem } from "@/lib/library/library-types";
import type { ContentType } from "@/lib/content/types";
import type { UserMediaStatus } from "@/lib/content/user-media-state";
import type { MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";

type WorkYourJourneySectionProps = {
  type: ContentType;
  status?: UserMediaStatus;
  startDate?: string;
  endDate?: string;
  rating?: number;
  moodTags: string[];
  journalEntry: MediaItem | null;
  photos: string[];
  libraryItem: LibraryItem | null;
};

function statusLabelFor(
  type: ContentType,
  status: UserMediaStatus | undefined,
): string {
  const labels = getLibraryLabels(type);
  if (status === "FINISHED") return labels.finished;
  if (status === "ONGOING") return labels.ongoing;
  if (status === "WANT") return labels.want;
  if (status === "DROPPED") return labels.dropped;
  return "Not started";
}

/**
 * Your Journey — personal relationship with this work.
 * Editorial metadata + journal memories; existing stores only.
 */
export function WorkYourJourneySection({
  type,
  status,
  startDate,
  endDate,
  rating,
  moodTags,
  journalEntry,
  photos,
  libraryItem,
}: WorkYourJourneySectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const records: WorkJournalRecord[] = useMemo(
    () => buildJournalRecords(journalEntry, photos, libraryItem),
    [journalEntry, photos, libraryItem],
  );

  const duration = formatDuration(startDate, endDate);

  return (
    <section className="mt-20 border-t border-white/[0.05] pt-14 md:mt-28 md:pt-16">
      <h2 className="font-display text-[24px] font-medium tracking-tight text-white/90 md:text-[26px]">
        Your Journey
      </h2>
      <p className="mt-3 text-[14px] text-white/34">
        Your personal relationship with this work.
      </p>

      <dl className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="font-label text-[10px] uppercase tracking-[0.16em] text-white/28">
            Status
          </dt>
          <dd className="mt-2 text-[15px] text-white/78">
            {statusLabelFor(type, status)}
          </dd>
        </div>
        <div>
          <dt className="font-label text-[10px] uppercase tracking-[0.16em] text-white/28">
            Started
          </dt>
          <dd className="mt-2 text-[15px] text-white/78">
            {formatArchiveDate(startDate)}
          </dd>
        </div>
        <div>
          <dt className="font-label text-[10px] uppercase tracking-[0.16em] text-white/28">
            Finished
          </dt>
          <dd className="mt-2 text-[15px] text-white/78">
            {formatArchiveDate(endDate)}
          </dd>
        </div>
        <div>
          <dt className="font-label text-[10px] uppercase tracking-[0.16em] text-white/28">
            Rating
          </dt>
          <dd className="mt-2 text-[15px] text-white/78">
            {rating && rating > 0 ? `${rating} / 5` : "—"}
          </dd>
        </div>
      </dl>

      {startDate || endDate ? (
        <p className="mt-6 text-[13px] text-white/36">
          Timeline · {duration}
        </p>
      ) : null}

      {moodTags.length > 0 ? (
        <div className="mt-12">
          <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/28">
            Mood tags
          </p>
          <LibraryMoodTags tags={moodTags} className="mt-4" />
        </div>
      ) : null}

      <div className="mt-12">
        <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/28">
          Journal memories
        </p>
        {records.length === 0 ? (
          <p className="mt-4 text-[14px] text-white/36">
            No journal memories yet for this work.
          </p>
        ) : (
          <ul className="mt-6 space-y-8">
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
                      "flex w-full items-start gap-5 bg-transparent text-left",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15",
                    )}
                  >
                    {record.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={record.photo}
                        alt=""
                        className="size-14 shrink-0 rounded-[6px] object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <span className="size-14 shrink-0 rounded-[6px] bg-white/[0.03] ring-1 ring-white/[0.06]" />
                    )}
                    <span className="min-w-0 flex-1 border-b border-white/[0.05] pb-8">
                      <span className="font-label text-[11px] tracking-[0.1em] text-white/32">
                        {formatArchiveDate(record.date)}
                      </span>
                      <span
                        className={cn(
                          "mt-2 block font-quote text-[15px] leading-relaxed text-white/62",
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
      </div>
    </section>
  );
}
