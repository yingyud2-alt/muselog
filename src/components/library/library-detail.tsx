"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { MemoryStars } from "@/components/calendar/memory-stars";
import { InteractiveStarRating } from "@/components/dashboard/bubble-rating-sheet";
import { MediaIcon } from "@/components/dashboard/mood-bubble-shared";
import { LibraryArchiveCover } from "@/components/library/library-archive-cover";
import { LibraryMoodTags } from "@/components/library/library-mood-tags";
import { LibraryPanelShell } from "@/components/library/library-panel-shell";
import { deriveLibraryMoodTags } from "@/components/library/library-visual-utils";
import { WorkStatusActions } from "@/components/work-status-actions";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import { getDisplayTodayString } from "@/lib/habit/habit-utils";
import { getLibraryLabels, PROGRESS_COLORS } from "@/lib/library/library-labels";
import { useLibraryItemActions } from "@/lib/library/use-library-actions";
import type { LibraryItem } from "@/lib/library/library-types";
import { cn } from "@/lib/utils";

type LibraryDetailProps = {
  item: LibraryItem | null;
  onClose: () => void;
};

function creatorRole(type: LibraryItem["type"]): string {
  if (type === "BOOK") return "Author";
  if (type === "MOVIE") return "Director";
  return "Artist";
}

function statusLabel(item: LibraryItem, labels: ReturnType<typeof getLibraryLabels>) {
  if (item.status === "WANT") return labels.want;
  if (item.status === "ONGOING") return labels.ongoing;
  if (item.status === "DROPPED") return labels.dropped;
  return labels.finished;
}

export function LibraryDetailContent({
  item,
  onClose,
}: {
  item: LibraryItem;
  onClose: () => void;
}) {
  const router = useRouter();
  const labels = getLibraryLabels(item.type);
  const actions = useLibraryItemActions(item);
  const moodTags = deriveLibraryMoodTags(item);

  const [panel, setPanel] = useState<"main" | "rating" | "progress">("main");
  const [rating, setRating] = useState(item.rating ?? 4);
  const [completedDate, setCompletedDate] = useState(getDisplayTodayString());
  const [review, setReview] = useState(item.shortReview ?? "");
  const [progress, setProgress] = useState(item.progress ?? 0);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [confirmRemove, setConfirmRemove] = useState(false);

  const saveRating = () => {
    actions.saveRating({
      rating,
      completedDate,
      shortReview: review.trim() || undefined,
    });
    setPanel("main");
  };

  const saveProgress = () => {
    actions.updateProgress(progress);
    if (progress >= 100) {
      setPanel("rating");
      return;
    }
    setPanel("main");
  };

  const description =
    item.shortReview?.trim() ||
    item.notes?.trim() ||
    "No note yet — a quiet place waiting for your words.";

  const timelineParts: string[] = [];
  if (item.startDate) timelineParts.push(`Started ${item.startDate}`);
  if (item.endDate) timelineParts.push(`Finished ${item.endDate}`);
  if (
    item.status === "ONGOING" &&
    typeof item.progress === "number" &&
    item.progress > 0
  ) {
    timelineParts.push(`${item.progress}% complete`);
  }

  return (
    <div className="md:flex md:gap-8 md:pr-6">
      <div className="mx-auto w-[180px] shrink-0 md:mx-0 md:w-[210px]">
        <LibraryArchiveCover
          cover={item.cover}
          title={item.title}
          className="rounded-[16px]"
        />
      </div>

      <div className="mt-5 min-w-0 flex-1 md:mt-0">
        <div className="flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.16em] text-white/40">
          <MediaIcon type={item.type} className="size-3.5" style={{ opacity: 0.7 }} />
          <span>{CONTENT_TYPE_LABELS[item.type]}</span>
        </div>

        <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight text-white/94 md:text-[30px]">
          {item.title}
        </h2>
        <p className="mt-1.5 text-[14px] text-white/48">
          <span className="text-white/32">{creatorRole(item.type)} · </span>
          {item.creator}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
          <span className="text-white/70">{statusLabel(item, labels)}</span>
          {timelineParts.length > 0 ? (
            <span className="text-white/38">{timelineParts.join(" · ")}</span>
          ) : null}
        </div>

        {item.status === "FINISHED" && item.rating && item.rating > 0 ? (
          <div className="mt-3">
            <MemoryStars rating={item.rating} size="md" />
          </div>
        ) : null}

        {item.status === "ONGOING" &&
        typeof item.progress === "number" &&
        item.progress > 0 ? (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-[12px] text-white/40">
              <span>Progress</span>
              <span>{item.progress}%</span>
            </div>
            <div className="h-[2px] overflow-hidden bg-white/10">
              <div
                className={cn("h-full", PROGRESS_COLORS[item.type])}
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        ) : null}

        <LibraryMoodTags tags={moodTags} className="mt-4" />

        <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-white/55">
          {description}
        </p>

        {panel === "rating" && (
          <div className="mt-5 border border-white/[0.08] bg-black/20 p-4">
            <p className="text-sm font-medium text-white/88">{labels.ratingTitle}</p>
            <InteractiveStarRating
              value={rating}
              onChange={setRating}
              className="mt-4"
            />
            <label className="mt-4 block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/42">
                {labels.completedDate}
              </span>
              <input
                type="date"
                value={completedDate}
                onChange={(event) => setCompletedDate(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85"
              />
            </label>
            <textarea
              value={review}
              onChange={(event) => setReview(event.target.value)}
              rows={2}
              placeholder="Optional short review"
              className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85 placeholder:text-white/28"
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPanel("main")}
                className="rounded-full border border-white/14 py-2 text-sm text-white/68"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveRating}
                className="rounded-full bg-white/92 py-2 text-sm font-medium text-black"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {panel === "progress" && (
          <div className="mt-5 border border-white/[0.08] bg-black/20 p-4">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/42">
                Progress
              </span>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(event) => setProgress(Number(event.target.value))}
                  className="w-full accent-teal-400/80"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(event) =>
                    setProgress(
                      Math.max(0, Math.min(100, Number(event.target.value))),
                    )
                  }
                  className="w-14 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-sm text-white/85"
                />
              </div>
            </label>
            {progress >= 100 ? (
              <p className="mt-2 text-xs text-white/45">Mark as Finished?</p>
            ) : null}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPanel("main")}
                className="rounded-full border border-white/14 py-2 text-sm text-white/68"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProgress}
                className="rounded-full bg-white/92 py-2 text-sm font-medium text-black"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {panel === "main" && (
          <div className="mt-6 space-y-3">
            <WorkStatusActions
              workId={item.mediaKey}
              type={item.type}
              title={item.title}
              creator={item.creator}
              cover={item.cover}
              variant="panel"
            />
            <div className="flex flex-wrap gap-2">
            {item.status === "WANT" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    actions.startNow();
                    onClose();
                  }}
                  className="rounded-full border border-white/14 px-5 py-2.5 text-sm text-white/72"
                >
                  {labels.startNow}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/calendar")}
                  className="rounded-full border border-white/14 px-5 py-2.5 text-sm text-white/72"
                >
                  Add to Journal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    actions.removeFromList();
                    onClose();
                  }}
                  className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/48"
                >
                  Remove from List
                </button>
              </>
            )}

            {item.status === "ONGOING" && (
              <>
                <button
                  type="button"
                  onClick={() => setPanel("progress")}
                  className="rounded-full border border-white/14 px-5 py-2.5 text-sm text-white/72"
                >
                  Update Progress
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/calendar")}
                  className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/62"
                >
                  View in Journal
                </button>
              </>
            )}

            {item.status === "FINISHED" && (
              <>
                <button
                  type="button"
                  onClick={() => router.push("/calendar")}
                  className="rounded-full border border-white/14 px-5 py-2.5 text-sm text-white/72"
                >
                  View in Journal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    actions.experienceAgain();
                    onClose();
                  }}
                  className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/68"
                >
                  {labels.again}
                </button>
              </>
            )}

            {item.status === "DROPPED" && (
              <button
                type="button"
                onClick={() => router.push("/calendar")}
                className="rounded-full border border-white/14 px-5 py-2.5 text-sm text-white/72"
              >
                Add to Journal
              </button>
            )}
            </div>
          </div>
        )}

        {panel === "main" && (
          <label className="mt-5 block max-w-xl">
            <span className="text-[10px] uppercase tracking-[0.14em] text-white/38">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              onBlur={() => actions.updateNotes(notes)}
              rows={2}
              className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85"
            />
          </label>
        )}

        {panel === "main" && item.status !== "WANT" && (
          <div className="mt-3">
            {!confirmRemove ? (
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="py-2 text-sm text-white/35"
              >
                Remove from Library
              </button>
            ) : (
              <div className="max-w-md border border-white/10 bg-white/[0.03] p-3">
                <p className="text-sm text-white/62">
                  Remove this title from your Library?
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(false)}
                    className="rounded-full border border-white/12 py-2 text-sm text-white/58"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      actions.removeFromLibrary();
                      onClose();
                    }}
                    className="rounded-full bg-white/90 py-2 text-sm text-black"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function LibraryDetail({ item, onClose }: LibraryDetailProps) {
  return (
    <LibraryPanelShell
      open={Boolean(item)}
      title={item?.title ?? "Library detail"}
      onClose={onClose}
      wide
    >
      {item ? (
        <LibraryDetailContent
          key={item.mediaKey}
          item={item}
          onClose={onClose}
        />
      ) : null}
    </LibraryPanelShell>
  );
}
