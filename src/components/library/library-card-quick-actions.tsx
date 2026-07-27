"use client";

import { useMemo, useState } from "react";

import { InteractiveStarRating } from "@/components/dashboard/bubble-rating-sheet";
import { openJournalQuickLog } from "@/lib/detail/detail-overlay-store";
import type { LibraryItem } from "@/lib/library/library-types";
import { cn } from "@/lib/utils";
import {
  getDropReasons,
  setWorkStatus,
  type WorkStatusIdentity,
} from "@/lib/work/work-status";

type PanelMode = "actions" | "finish" | "rate" | "drop";

type LibraryCardQuickActionsProps = {
  item: LibraryItem;
  className?: string;
  /** Compact row for shelf / grid cards. */
  density?: "default" | "compact";
};

/**
 * Library-card actions that reuse the shared Work status write path.
 * Finished / Rate / Add Journal / Drop — no duplicate state stores.
 */
export function LibraryCardQuickActions({
  item,
  className,
  density = "default",
}: LibraryCardQuickActionsProps) {
  const [mode, setMode] = useState<PanelMode>("actions");
  const [rating, setRating] = useState(
    item.rating && item.rating > 0 ? item.rating : 4,
  );
  const [review, setReview] = useState(item.shortReview ?? "");
  const [dropReason, setDropReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  const identity: WorkStatusIdentity = useMemo(
    () => ({
      id: item.mediaKey,
      type: item.type,
      title: item.title,
      creator: item.creator,
      cover: item.cover,
    }),
    [item],
  );

  const dropReasons = getDropReasons();
  const isOtherSelected =
    dropReason === "Other" || dropReason.startsWith("Other:");
  const compact = density === "compact";

  const stop = (event: React.MouseEvent | React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const applyFinished = () => {
    setWorkStatus(identity, {
      status: "finished",
      rating,
      review: review.trim() || undefined,
    });
    setMode("actions");
  };

  const applyDrop = () => {
    const reason =
      dropReason === "Other" || dropReason.startsWith("Other")
        ? otherReason.trim()
          ? `Other: ${otherReason.trim()}`
          : "Other"
        : dropReason || undefined;
    setWorkStatus(identity, {
      status: "dropped",
      droppedReason: reason,
    });
    setMode("actions");
  };

  if (mode === "finish" || mode === "rate") {
    return (
      <div
        className={cn(
          "space-y-2.5 rounded-[14px] border border-white/10 bg-[#0E141C] p-3",
          className,
        )}
        onClick={stop}
      >
        <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/38">
          {mode === "rate" ? "Rate" : "Finished"}
        </p>
        <InteractiveStarRating
          value={rating}
          onChange={setRating}
          className="justify-start"
        />
        {mode === "finish" ? (
          <textarea
            value={review}
            onChange={(event) => setReview(event.target.value)}
            rows={2}
            placeholder="A quiet reflection..."
            className="w-full resize-none rounded-xl border border-white/10 bg-transparent px-3 py-2 text-[12px] text-white/82 placeholder:text-white/28 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
          />
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(event) => {
              stop(event);
              setMode("actions");
            }}
            className="flex-1 rounded-full border border-white/14 px-2.5 py-1.5 text-[12px] text-white/60 hover:border-white/24 hover:text-white/80"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={rating < 1}
            onClick={(event) => {
              stop(event);
              applyFinished();
            }}
            className="flex-1 rounded-full border border-white/22 bg-white/[0.08] px-2.5 py-1.5 text-[12px] text-white/88 hover:bg-white/[0.12] disabled:opacity-40"
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
          "space-y-2.5 rounded-[14px] border border-white/10 bg-[#0E141C] p-3",
          className,
        )}
        onClick={stop}
      >
        <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/38">
          Drop
        </p>
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
                "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
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
            className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-[12px] text-white/82 placeholder:text-white/28 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
          />
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(event) => {
              stop(event);
              setMode("actions");
            }}
            className="flex-1 rounded-full border border-white/14 px-2.5 py-1.5 text-[12px] text-white/60 hover:border-white/24 hover:text-white/80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(event) => {
              stop(event);
              applyDrop();
            }}
            className="flex-1 rounded-full border border-white/22 bg-white/[0.08] px-2.5 py-1.5 text-[12px] text-white/88 hover:bg-white/[0.12]"
          >
            Confirm
          </button>
        </div>
      </div>
    );
  }

  const buttonClass = cn(
    "rounded-full border border-white/12 bg-transparent text-white/58 transition-colors",
    "hover:border-white/22 hover:text-white/82",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20",
    compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-[11px]",
  );

  return (
    <div
      className={cn("flex flex-wrap gap-1.5", className)}
      onClick={stop}
      role="group"
      aria-label={`Actions for ${item.title}`}
    >
      <button
        type="button"
        className={buttonClass}
        onClick={(event) => {
          stop(event);
          setRating(item.rating && item.rating > 0 ? item.rating : 4);
          setReview(item.shortReview ?? "");
          setMode("finish");
        }}
      >
        Finished
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={(event) => {
          stop(event);
          setRating(item.rating && item.rating > 0 ? item.rating : 4);
          setMode("rate");
        }}
      >
        Rate
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={(event) => {
          stop(event);
          openJournalQuickLog(item.mediaKey, {
            snapshot: {
              title: item.title,
              creator: item.creator,
              type: item.type,
              cover: item.cover,
            },
          });
        }}
      >
        Add Journal
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={(event) => {
          stop(event);
          setDropReason("");
          setOtherReason("");
          setMode("drop");
        }}
      >
        Drop
      </button>
    </div>
  );
}
