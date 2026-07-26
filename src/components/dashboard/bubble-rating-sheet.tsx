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
};

export function BubbleRatingSheet({
  work,
  initialRating = 0,
  onSave,
  onCancel,
  className,
}: BubbleRatingSheetProps) {
  const labels = getBubbleActionLabels(work.type);
  const today = getDisplayTodayString();
  const [rating, setRating] = useState(initialRating || 4);
  const [completedDate, setCompletedDate] = useState(today);
  const [shortReview, setShortReview] = useState("");

  return (
    <div
      className={cn(
        "mt-5 rounded-2xl border border-white/10 bg-black/15 p-4 text-left backdrop-blur-sm",
        className,
      )}
      onClick={(event) => event.stopPropagation()}
    >
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
          {labels.completedDateLabel}
        </span>
        <input
          type="date"
          value={completedDate}
          onChange={(event) => setCompletedDate(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        />
      </label>

      <label className="mt-3 block">
        <span className="text-[10px] uppercase tracking-[0.14em] text-white/42">
          {labels.reviewPlaceholder}
        </span>
        <textarea
          value={shortReview}
          onChange={(event) => setShortReview(event.target.value)}
          rows={2}
          placeholder="A few words about this work..."
          className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85 placeholder:text-white/28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        />
      </label>

      <div className="mt-4 grid grid-cols-2 gap-2">
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
