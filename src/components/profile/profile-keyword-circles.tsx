"use client";

import { ARCHIVE_TOKEN_COLORS } from "@/components/profile/profile-archive-palette";
import type { MuseKeyword } from "@/lib/profile/muse-profile-data";
import { cn } from "@/lib/utils";

type ProfileKeywordCirclesProps = {
  keywords: MuseKeyword[];
  className?: string;
  compact?: boolean;
};

/**
 * Compact cool archive keyword chips for monthly/year sections.
 * Solid muted tones — not glass Home bubbles.
 */
export function ProfileKeywordCircles({
  keywords,
  className,
  compact = false,
}: ProfileKeywordCirclesProps) {
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center justify-center gap-2",
        compact ? "min-h-0 gap-2" : "min-h-[88px] gap-2.5",
        className,
      )}
    >
      {keywords.map((keyword, index) => {
        const background =
          ARCHIVE_TOKEN_COLORS[index % ARCHIVE_TOKEN_COLORS.length];

        return (
          <li
            key={`${keyword.label}-${index}`}
            className={cn(
              "inline-flex items-center justify-center rounded-full border border-black/15",
              "text-center font-display font-bold lowercase leading-tight text-[#F2F5F4]",
              "shadow-[0_1px_3px_rgba(0,0,0,0.25)]",
              compact
                ? "min-h-11 min-w-11 px-2.5 text-[10px]"
                : "min-h-14 min-w-14 px-3 text-[11px]",
            )}
            style={{ backgroundColor: background }}
          >
            {keyword.label}
          </li>
        );
      })}
    </ul>
  );
}
