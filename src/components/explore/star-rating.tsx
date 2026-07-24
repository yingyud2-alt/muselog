"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
};

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: StarRatingProps) {
  const iconSize = size === "sm" ? "size-4" : "size-5";

  return (
    <div
      className="flex items-center gap-0.5"
      role={readOnly ? "img" : "group"}
      aria-label={readOnly ? `${value} out of 5 stars` : "Rate this work"}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= value;

        return (
          <button
            key={starValue}
            type="button"
            disabled={readOnly}
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
            onClick={() => onChange?.(starValue)}
            className={cn(
              "rounded-sm transition-colors",
              readOnly ? "cursor-default" : "cursor-pointer hover:scale-105",
            )}
          >
            <Star
              className={cn(
                iconSize,
                filled
                  ? "fill-amber-300 text-amber-300"
                  : "text-white/25",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
