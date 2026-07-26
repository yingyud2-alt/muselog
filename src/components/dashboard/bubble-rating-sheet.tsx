"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { getBubbleActionLabels } from "@/components/dashboard/bubble-action-labels";
import type { WorkBubble } from "@/components/dashboard/mood-bubble-data";
import type { RatingFormValues } from "@/lib/content/user-media-state";
import { getDisplayTodayString } from "@/lib/habit/habit-utils";
import { cn } from "@/lib/utils";

type InteractiveStarRatingProps = {
  value: number;
  onChange: (rating: number) => void;
  className?: string;
};

export function InteractiveStarRating({
  value,
  onChange,
  className,
}: InteractiveStarRatingProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-1.5", className)}
      role="radiogroup"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`Rate ${star} stars`}
          onClick={(event) => {
            event.stopPropagation();
            onChange(star);
          }}
          className="rounded-md p-1 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          <Star
            className={cn(
              "size-7 md:size-6",
              star <= value
                ? "fill-amber-300/90 text-amber-300/90"
                : "text-white/25",
            )}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}

type BubbleRatingSheetProps = {
  work: WorkBubble;
  initialRating?: number;
  onSave: (values: RatingFormValues) => void;
  onCancel: () => void;
  className?: string;
  /** nested = mobile sheet card; panel = desktop glass modal body */
  presentation?: "nested" | "panel";
};

export function BubbleRatingSheet({
  work,
  initialRating = 0,
  onSave,
  onCancel,
  className,
  presentation = "nested",
}: BubbleRatingSheetProps) {
  const labels = getBubbleActionLabels(work.type);
  const today = getDisplayTodayString();
  const [rating, setRating] = useState(initialRating || 4);
  const [completedDate, setCompletedDate] = useState(today);
  const [shortReview, setShortReview] = useState("");
  const isPanel = presentation === "panel";

  return (
    <div
      className={cn(
        "text-left",
        isPanel
          ? "space-y-4"
          : "mt-5 rounded-2xl border border-white/10 bg-black/15 p-4 backdrop-blur-sm",
        className,
      )}
      onClick={(event) => event.stopPropagation()}
    >
      <div>
        <p
          className={cn(
            "font-medium text-white/88",
            isPanel ? "text-left text-lg" : "text-center text-sm",
          )}
        >
          {isPanel ? work.title : labels.ratingTitle}
        </p>
        {isPanel ? (
          <p className="mt-1 text-sm text-white/45">{labels.ratingTitle}</p>
        ) : null}
      </div>

      {isPanel ? (
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.14em] text-white/42">
            Status
          </span>
          <span className="rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[11px] text-white/70">
            Finished
          </span>
        </div>
      ) : null}

      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/42">
          Rating
        </p>
        <InteractiveStarRating
          value={rating}
          onChange={setRating}
          className={cn("mt-2", isPanel ? "justify-start" : "justify-center")}
        />
      </div>

      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.14em] text-white/42">
          {labels.completedDateLabel}
        </span>
        <input
          type="date"
          value={completedDate}
          onChange={(event) => setCompletedDate(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        />
      </label>

      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.14em] text-white/42">
          Review / reflection
        </span>
        <textarea
          value={shortReview}
          onChange={(event) => setShortReview(event.target.value)}
          rows={isPanel ? 3 : 2}
          placeholder="A few words about this work..."
          className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85 placeholder:text-white/28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        />
      </label>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onCancel();
          }}
          className="rounded-full border border-white/14 py-2.5 text-sm text-white/68 transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={rating < 1}
          onClick={(event) => {
            event.stopPropagation();
            onSave({
              rating,
              completedDate: completedDate || today,
              shortReview: shortReview.trim() || undefined,
            });
          }}
          className="rounded-full bg-white/92 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  );
}
