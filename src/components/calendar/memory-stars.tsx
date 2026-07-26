import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type MemoryStarsProps = {
  rating: number;
  size?: "xs" | "sm" | "md";
  className?: string;
};

const SIZE_MAP = {
  xs: "size-2",
  sm: "size-2.5",
  md: "size-3.5",
} as const;

export function MemoryStars({
  rating,
  size = "sm",
  className,
}: MemoryStarsProps) {
  const iconSize = SIZE_MAP[size];

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            iconSize,
            index < rating
              ? "fill-amber-300/85 text-amber-300/85"
              : "text-white/18",
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
