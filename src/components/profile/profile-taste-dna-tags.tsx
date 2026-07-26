"use client";

import { ARCHIVE, ARCHIVE_TOKEN_COLORS } from "@/components/profile/profile-archive-palette";
import type { MuseKeyword } from "@/lib/profile/muse-profile-data";
import { cn } from "@/lib/utils";

const PAPER_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E\")";

const ORGANIC_OFFSETS = [
  "mt-0 translate-x-0",
  "mt-5 -translate-x-1",
  "mt-1 translate-x-3",
  "mt-7 translate-x-1",
  "mt-2 -translate-x-2",
  "mt-4 translate-x-2",
] as const;

type ProfileTasteDnaTagsProps = {
  keywords: MuseKeyword[];
  className?: string;
};

function explanationFor(label: string): string {
  const key = label.toLowerCase();

  if (key.includes("nostalg")) {
    return "Your works often return to themes of memory and time.";
  }
  if (key.includes("reflect")) {
    return "Quiet reflection threads through the stories you keep.";
  }
  if (key.includes("human") || key.includes("connection")) {
    return "You linger with relationships and human presence.";
  }
  if (key.includes("slow") || key.includes("cinema")) {
    return "Unhurried images and soft pacing shape your gaze.";
  }
  if (key.includes("dream")) {
    return "Soft, dreamlike atmospheres recur in your archive.";
  }
  if (key.includes("quiet") || key.includes("moment")) {
    return "Stillness and small moments hold lasting weight.";
  }
  if (key.includes("memory")) {
    return "Memory is a recurring room in your cultural archive.";
  }
  if (key.includes("visual") || key.includes("poet")) {
    return "Visual poetry draws your attention again and again.";
  }

  return `AI reads “${label}” as a quiet signal in your cultural identity.`;
}

function tokenSize(weight: number): string {
  if (weight >= 5) return "size-[76px] text-[11px] md:size-[82px] md:text-[12px]";
  if (weight >= 4) return "size-[68px] text-[10px] md:size-[74px] md:text-[11px]";
  return "size-[60px] text-[10px] md:size-[66px]";
}

/**
 * Taste DNA — circular paper archive tokens.
 * Cool muted solids only; no glass, glow, or mint rainbow accents.
 */
export function ProfileTasteDnaTags({
  keywords,
  className,
}: ProfileTasteDnaTagsProps) {
  return (
    <ul
      className={cn(
        "relative mx-auto flex max-w-md flex-wrap items-start justify-center gap-x-2 gap-y-1 px-1",
        className,
      )}
      aria-label="Taste DNA keywords"
    >
      {keywords.map((keyword, index) => {
        const background =
          ARCHIVE_TOKEN_COLORS[index % ARCHIVE_TOKEN_COLORS.length];
        const offset = ORGANIC_OFFSETS[index % ORGANIC_OFFSETS.length];

        return (
          <li
            key={`${keyword.label}-${index}`}
            className={cn("group relative z-0 hover:z-10", offset)}
          >
            <button
              type="button"
              className={cn(
                "relative inline-flex items-center justify-center overflow-hidden rounded-full",
                "border border-black/15 px-2 text-center font-display font-bold leading-tight lowercase",
                "shadow-[0_1px_3px_rgba(0,0,0,0.28)]",
                "transition-[transform,box-shadow] duration-300 ease-out",
                "hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(0,0,0,0.32)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                tokenSize(keyword.weight),
              )}
              style={{
                backgroundColor: background,
                color: ARCHIVE.ink,
                backgroundImage: PAPER_GRAIN,
                backgroundBlendMode: "multiply",
              }}
              aria-describedby={`taste-dna-tip-${index}`}
            >
              <span className="relative line-clamp-2 px-1">{keyword.label}</span>
            </button>

            <span
              id={`taste-dna-tip-${index}`}
              role="tooltip"
              className={cn(
                "pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-20 w-max max-w-[210px] -translate-x-1/2",
                "rounded-md border px-2.5 py-1.5",
                "font-body text-[11px] leading-snug",
                "opacity-0 transition-opacity duration-300",
                "group-hover:opacity-100 group-focus-within:opacity-100",
              )}
              style={{
                backgroundColor: ARCHIVE.navyElevated,
                borderColor: ARCHIVE.border,
                color: "rgba(242,245,244,0.78)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
              }}
            >
              {explanationFor(keyword.label)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
