"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

import { MemoryStars } from "@/components/calendar/memory-stars";
import { InteractiveStarRating } from "@/components/dashboard/bubble-rating-sheet";
import { MediaIcon } from "@/components/dashboard/mood-bubble-shared";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import { getDisplayTodayString } from "@/lib/habit/habit-utils";
import { getLibraryLabels, PROGRESS_COLORS } from "@/lib/library/library-labels";
import { useLibraryItemActions } from "@/lib/library/use-library-actions";
import type { LibraryItem } from "@/lib/library/library-types";
import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";
import { cn } from "@/lib/utils";

type LibraryDetailProps = {
  item: LibraryItem | null;
  onClose: () => void;
};

function LibraryDetailContent({
  item,
  onClose,
}: {
  item: LibraryItem;
  onClose: () => void;
}) {
  const router = useRouter();
  const labels = getLibraryLabels(item.type);
  const actions = useLibraryItemActions(item);

  const [panel, setPanel] = useState<"main" | "rating" | "progress">("main");
  const [rating, setRating] = useState(item.rating ?? 4);
  const [completedDate, setCompletedDate] = useState(getDisplayTodayString());
  const [review, setReview] = useState(item.shortReview ?? "");
  const [progress, setProgress] = useState(item.progress ?? 0);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [confirmRemove, setConfirmRemove] = useState(false);

  const stop = (event: React.MouseEvent) => event.stopPropagation();

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

  return (
    <div onClick={stop}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full text-white/65 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 md:right-5 md:top-5"
      >
        <X size={18} />
      </button>

      <div className="mx-auto max-w-[220px]">
        <div
          className={cn(
            "aspect-[2/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br ring-1 ring-white/10",
            item.cover,
          )}
        />
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/42">
        <MediaIcon type={item.type} className="size-3.5" style={{ opacity: 0.7 }} />
        <span>{CONTENT_TYPE_LABELS[item.type]}</span>
      </div>

      <h2 className="mt-2 text-center text-2xl font-semibold text-white/92">
        {item.title}
      </h2>
      <p className="mt-1 text-center text-sm text-white/48">{item.creator}</p>

      {item.status === "FINISHED" && item.rating && item.rating > 0 && (
        <div className="mt-4 flex justify-center">
          <MemoryStars rating={item.rating} size="md" />
        </div>
      )}

      <div className="mt-4 space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm text-white/58">
        <div className="flex justify-between gap-3">
          <span className="text-white/38">Status</span>
          <span className="text-right text-white/72">
            {item.status === "WANT"
              ? labels.want
              : item.status === "ONGOING"
                ? labels.ongoing
                : labels.finished}
          </span>
        </div>
        {item.startDate && (
          <div className="flex justify-between gap-3">
            <span className="text-white/38">Start</span>
            <span>{item.startDate}</span>
          </div>
        )}
        {item.endDate && (
          <div className="flex justify-between gap-3">
            <span className="text-white/38">End</span>
            <span>{item.endDate}</span>
          </div>
        )}
        {item.status === "ONGOING" &&
          typeof item.progress === "number" &&
          item.progress > 0 && (
            <div>
              <div className="mb-1.5 flex justify-between">
                <span className="text-white/38">Progress</span>
                <span>{item.progress}%</span>
              </div>
              <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn("h-full rounded-full", PROGRESS_COLORS[item.type])}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}
        {item.shortReview && (
          <div>
            <span className="text-white/38">Review</span>
            <p className="mt-1 leading-relaxed text-white/68">{item.shortReview}</p>
          </div>
        )}
      </div>

      {panel === "rating" && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4">
          <p className="text-center text-sm font-medium text-white/88">
            {labels.ratingTitle}
          </p>
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
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4">
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
                  setProgress(Math.max(0, Math.min(100, Number(event.target.value))))
                }
                className="w-14 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-sm text-white/85"
              />
            </div>
          </label>
          {progress >= 100 && (
            <p className="mt-2 text-xs text-white/45">Mark as Finished?</p>
          )}
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
        <div className="mt-5 space-y-2">
          {item.status === "WANT" && (
            <>
              <button
                type="button"
                onClick={() => {
                  actions.startNow();
                  onClose();
                }}
                className="w-full rounded-full bg-white/92 py-3 text-sm font-medium text-black"
              >
                {labels.startNow}
              </button>
              <button
                type="button"
                onClick={() => router.push("/calendar")}
                className="w-full rounded-full border border-white/14 py-2.5 text-sm text-white/72"
              >
                Add to Journal
              </button>
              <button
                type="button"
                onClick={() => {
                  actions.removeFromList();
                  onClose();
                }}
                className="w-full rounded-full border border-white/10 py-2.5 text-sm text-white/52"
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
                className="w-full rounded-full bg-white/92 py-3 text-sm font-medium text-black"
              >
                Update Progress
              </button>
              <button
                type="button"
                onClick={() => setPanel("rating")}
                className="w-full rounded-full border border-white/14 bg-white/[0.06] py-2.5 text-sm text-white/78"
              >
                {labels.completedRate}
              </button>
              <button
                type="button"
                onClick={() => router.push("/calendar")}
                className="w-full rounded-full border border-white/10 py-2.5 text-sm text-white/62"
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
                className="w-full rounded-full bg-white/92 py-3 text-sm font-medium text-black"
              >
                View in Journal
              </button>
              <button
                type="button"
                onClick={() => setPanel("rating")}
                className="w-full rounded-full border border-white/14 py-2.5 text-sm text-white/72"
              >
                Edit Rating
              </button>
              <button
                type="button"
                onClick={() => {
                  actions.experienceAgain();
                  onClose();
                }}
                className="w-full rounded-full border border-white/10 bg-white/[0.05] py-2.5 text-sm text-white/72"
              >
                {labels.again}
              </button>
            </>
          )}

          <label className="block pt-2">
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

          {item.status !== "WANT" && (
            <>
              {!confirmRemove ? (
                <button
                  type="button"
                  onClick={() => setConfirmRemove(true)}
                  className="w-full py-2 text-sm text-white/38"
                >
                  Remove from Library
                </button>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function LibraryDetail({ item, onClose }: LibraryDetailProps) {
  useEffect(() => {
    if (!item) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.button
            type="button"
            aria-label="Close library detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] hidden bg-black/65 backdrop-blur-md md:block"
          />
          <motion.button
            type="button"
            aria-label="Close library detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-sm md:hidden"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={item.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed z-[61] overflow-y-auto bg-[#121820]/95 text-white backdrop-blur-2xl inset-x-0 bottom-0 max-h-[88svh] rounded-t-[28px] border border-white/10 p-5 md:hidden"
            style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
            onClick={(event) => event.stopPropagation()}
          >
            <LibraryDetailContent
              key={item.mediaKey}
              item={item}
              onClose={onClose}
            />
          </motion.div>

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={item.title}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="fixed left-1/2 top-1/2 z-[61] hidden max-h-[min(88vh,760px)] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] border border-white/10 bg-[#121820]/95 p-6 backdrop-blur-2xl md:block"
            onClick={(event) => event.stopPropagation()}
          >
            <LibraryDetailContent
              key={item.mediaKey}
              item={item}
              onClose={onClose}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
