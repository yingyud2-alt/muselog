"use client";

import { useMemo, useState } from "react";

import { InteractiveStarRating } from "@/components/dashboard/bubble-rating-sheet";
import { useUserMediaStateMap } from "@/lib/content/user-media-state";
import type { ContentType } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import {
  getDropReasons,
  readingLabelForType,
  setWorkStatus,
  toWorkUserStatus,
  wantLabelForType,
  type WorkStatusIdentity,
} from "@/lib/work/work-status";
import type { WorkType, WorkUserStatus } from "@/types/work";

export type WorkStatusActionsProps = {
  workId: string;
  type: WorkType | ContentType;
  title: string;
  creator: string;
  cover?: string;
  /** Compact for cards / batch rows; panel for modals & detail. */
  variant?: "panel" | "compact";
  className?: string;
  onStatusChange?: (status: WorkUserStatus) => void;
};

type PanelMode = "actions" | "finish" | "drop";

/**
 * Unified work relationship controls.
 * Lifecycle: Want → Reading/Watching/Listening → Finished (+ rating)
 * or Drop (+ reason). Type-aware labels.
 */
export function WorkStatusActions({
  workId,
  type,
  title,
  creator,
  cover,
  variant = "panel",
  className,
  onStatusChange,
}: WorkStatusActionsProps) {
  const stateMap = useUserMediaStateMap();
  const stored = stateMap[workId];
  const status = toWorkUserStatus(stored?.status ?? "NONE");
  const hasStatus = Boolean(stored && stored.status !== "NONE");
  const activeStatus: WorkUserStatus | "none" = hasStatus ? status : "none";

  const [mode, setMode] = useState<PanelMode>("actions");
  const [rating, setRating] = useState(
    stored?.rating && stored.rating > 0 ? stored.rating : 4,
  );
  const [review, setReview] = useState(stored?.shortReview ?? "");
  const [dropReason, setDropReason] = useState(
    stored?.droppedReason ?? stored?.notes ?? "",
  );
  const [otherReason, setOtherReason] = useState("");

  const identity: WorkStatusIdentity = useMemo(
    () => ({
      id: workId,
      type,
      title,
      creator,
      coverUrl: cover,
    }),
    [workId, type, title, creator, cover],
  );

  const wantLabel = wantLabelForType(type);
  const readingLabel = readingLabelForType(type);
  const dropReasons = getDropReasons();
  const isCompact = variant === "compact";
  const isOtherSelected = dropReason === "Other" || dropReason.startsWith("Other:");

  const apply = (
    next: WorkUserStatus,
    extras?: {
      rating?: number;
      review?: string;
      droppedReason?: string;
    },
  ) => {
    setWorkStatus(identity, {
      status: next,
      rating: extras?.rating,
      review: extras?.review,
      droppedReason: extras?.droppedReason,
    });
    onStatusChange?.(next);
    setMode("actions");
  };

  const stop = (event: React.MouseEvent | React.FormEvent) => {
    event.stopPropagation();
  };

  const openFinish = () => {
    setRating(stored?.rating && stored.rating > 0 ? stored.rating : 4);
    setReview(stored?.shortReview ?? "");
    setMode("finish");
  };

  const openDrop = () => {
    const existing = stored?.droppedReason ?? stored?.notes ?? "";
    const known = dropReasons.some((reason) => reason === existing);
    if (existing && !known) {
      setDropReason("Other");
      setOtherReason(
        existing === "Other" ? "" : existing.replace(/^Other:\s*/, ""),
      );
    } else {
      setDropReason(existing);
      setOtherReason("");
    }
    setMode("drop");
  };

  if (mode === "finish") {
    return (
      <div
        className={cn(
          "space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4",
          className,
        )}
        onClick={stop}
      >
        <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/38">
          Finished
        </p>
        <div>
          <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/38">
            Rating
          </p>
          <InteractiveStarRating
            value={rating}
            onChange={setRating}
            className={cn("mt-2", isCompact ? "justify-center" : "justify-start")}
          />
        </div>
        <label className="block">
          <span className="font-label text-[10px] uppercase tracking-[0.14em] text-white/38">
            Short review
          </span>
          <textarea
            value={review}
            onChange={(event) => setReview(event.target.value)}
            rows={2}
            placeholder="A quiet reflection..."
            className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white/82 placeholder:text-white/28 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(event) => {
              stop(event);
              setMode("actions");
            }}
            className="flex-1 rounded-full border border-white/14 px-3 py-2 text-sm text-white/60 transition-colors hover:border-white/24 hover:text-white/80"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={rating < 1}
            onClick={(event) => {
              stop(event);
              apply("finished", {
                rating,
                review: review.trim() || undefined,
              });
            }}
            className="flex-1 rounded-full border border-white/22 bg-white/[0.08] px-3 py-2 text-sm text-white/88 transition-colors hover:bg-white/[0.12] disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  if (mode === "drop") {
    return (
      <div
        className={cn(
          "space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4",
          className,
        )}
        onClick={stop}
      >
        <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/38">
          Drop
        </p>
        <p className="text-sm text-white/48">Why are you dropping this?</p>
        <div className="flex flex-wrap gap-1.5">
          {dropReasons.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={(event) => {
                stop(event);
                setDropReason(reason);
                if (reason !== "Other") setOtherReason("");
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] transition-colors",
                (reason === "Other" ? isOtherSelected : dropReason === reason)
                  ? "border-white/24 bg-white/[0.08] text-white/85"
                  : "border-white/10 text-white/48 hover:border-white/18 hover:text-white/68",
              )}
            >
              {reason}
            </button>
          ))}
        </div>
        {isOtherSelected ? (
          <input
            type="text"
            value={otherReason}
            onChange={(event) => setOtherReason(event.target.value)}
            placeholder="Brief reason..."
            className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white/82 placeholder:text-white/28 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
          />
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(event) => {
              stop(event);
              setMode("actions");
            }}
            className="flex-1 rounded-full border border-white/14 px-3 py-2 text-sm text-white/60 transition-colors hover:border-white/24 hover:text-white/80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(event) => {
              stop(event);
              const reason =
                dropReason === "Other" || dropReason.startsWith("Other")
                  ? otherReason.trim()
                    ? `Other: ${otherReason.trim()}`
                    : "Other"
                  : dropReason || undefined;
              apply("dropped", { droppedReason: reason });
            }}
            className="flex-1 rounded-full border border-white/22 bg-white/[0.08] px-3 py-2 text-sm text-white/88 transition-colors hover:bg-white/[0.12]"
          >
            Confirm
          </button>
        </div>
      </div>
    );
  }

  const buttonClass = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20",
      isCompact ? "px-2.5 py-1.5 text-[12px]" : "px-4 py-2.5",
      active
        ? "border-white/24 bg-white/[0.08] text-white/88"
        : "border-white/12 bg-transparent text-white/62 hover:border-white/20 hover:text-white/80",
    );

  return (
    <div className={cn("space-y-2", className)} onClick={stop}>
      <div
        className={cn("flex flex-wrap gap-2", isCompact && "gap-1.5")}
        role="group"
        aria-label="Work status"
      >
        <button
          type="button"
          aria-pressed={activeStatus === "want"}
          className={buttonClass(activeStatus === "want")}
          onClick={(event) => {
            stop(event);
            apply("want");
          }}
        >
          {wantLabel}
        </button>

        <button
          type="button"
          aria-pressed={activeStatus === "reading"}
          className={buttonClass(activeStatus === "reading")}
          onClick={(event) => {
            stop(event);
            apply("reading");
          }}
        >
          {readingLabel}
        </button>

        <button
          type="button"
          aria-pressed={activeStatus === "finished"}
          className={buttonClass(activeStatus === "finished")}
          onClick={(event) => {
            stop(event);
            openFinish();
          }}
        >
          Finished
        </button>

        <button
          type="button"
          aria-pressed={activeStatus === "dropped"}
          className={buttonClass(activeStatus === "dropped")}
          onClick={(event) => {
            stop(event);
            openDrop();
          }}
        >
          Dropped
        </button>
      </div>

      {activeStatus === "finished" && stored?.rating ? (
        <p className="text-[12px] text-white/42">
          Rated {stored.rating}/5
          {stored.shortReview ? ` · ${stored.shortReview}` : ""}
        </p>
      ) : null}

      {activeStatus === "dropped" &&
      (stored?.droppedReason || stored?.notes) ? (
        <p className="text-[12px] text-white/42">
          Dropped · {stored.droppedReason || stored.notes}
        </p>
      ) : null}

      {activeStatus === "reading" ? (
        <p className="text-[12px] text-white/42">Currently {readingLabel.toLowerCase()}</p>
      ) : null}
    </div>
  );
}
