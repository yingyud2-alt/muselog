"use client";

import Link from "next/link";

import { LibraryArchiveCover } from "@/components/library/library-archive-cover";
import { formatRecommendationWhy } from "@/components/library/library-recommendation-utils";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import type { Recommendation } from "@/lib/ai/recommendation-engine";
import { openRecommendationBatch } from "@/lib/detail/detail-overlay-store";
import { cn } from "@/lib/utils";

type LibraryAiCuratedProps = {
  recommendations: Recommendation[];
  onSelect: (recommendation: Recommendation) => void;
  className?: string;
};

/**
 * Library AI Curated shelf — cards stay in Library and open a detail panel.
 */
export function LibraryAiCurated({
  recommendations,
  onSelect,
  className,
}: LibraryAiCuratedProps) {
  if (recommendations.length === 0) return null;

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-medium tracking-tight text-white/90">
            AI Curated For You
          </h2>
          <p className="text-sm text-white/40">
            Soft next works drawn from your archive patterns
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            onClick={() => openRecommendationBatch(recommendations)}
            className="text-[13px] text-white/42 transition-colors hover:text-white/70"
          >
            See More
          </button>
          <Link
            href="/explore"
            className="text-[13px] text-white/42 transition-colors hover:text-white/70"
          >
            Explore more →
          </Link>
        </div>
      </div>

      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
        {recommendations.map((recommendation) => (
          <button
            key={recommendation.id}
            type="button"
            onClick={() => onSelect(recommendation)}
            className={cn(
              "group w-[168px] shrink-0 text-left",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15",
            )}
          >
            <LibraryArchiveCover
              cover={recommendation.cover}
              title={recommendation.title}
              className="rounded-[16px] transition-transform duration-300 group-hover:-translate-y-0.5"
            />
            <p className="mt-3 font-label text-[10px] uppercase tracking-[0.14em] text-white/32">
              {CONTENT_TYPE_LABELS[recommendation.type]}
            </p>
            <p className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug text-white/88">
              {recommendation.title}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-white/40">
              {recommendation.creator}
            </p>
            <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-white/42">
              {formatRecommendationWhy(recommendation)}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
