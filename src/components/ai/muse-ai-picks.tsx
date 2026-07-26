"use client";

import { Sparkles } from "lucide-react";

import { MemoryCover } from "@/components/calendar/memory-cover";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import type { Recommendation } from "@/lib/ai/recommendation-engine";
import {
  openRecommendationBatch,
  openRecommendationDetail,
} from "@/lib/detail/detail-overlay-store";
import { cn } from "@/lib/utils";

type MuseAiPicksProps = {
  recommendations: Recommendation[];
  /** Full pool for See More batch (~10). Defaults to recommendations. */
  batchRecommendations?: Recommendation[];
  title?: string;
  description?: string;
  className?: string;
  /** compact = denser home/library shelf */
  variant?: "default" | "compact";
};

function RecommendationCard({
  recommendation,
  compact,
}: {
  recommendation: Recommendation;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => openRecommendationDetail(recommendation)}
      className={cn(
        "group block shrink-0 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-left",
        "shadow-[0_10px_28px_rgba(0,0,0,0.18)] backdrop-blur-md",
        "transition hover:-translate-y-0.5 hover:border-teal-300/18 hover:bg-white/[0.05]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200/20",
        compact ? "w-[168px] p-3" : "w-[200px] p-3.5",
      )}
    >
      <MemoryCover
        cover={recommendation.cover}
        title={recommendation.title}
        className={cn(
          "w-full rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.25)]",
          "aspect-[2/3]",
        )}
      />

      <p className="font-label mt-3 text-[10px] uppercase tracking-[0.14em] text-white/32">
        {CONTENT_TYPE_LABELS[recommendation.type]}
      </p>
      <p className="font-display mt-1 line-clamp-2 text-[13px] font-normal leading-snug text-white/88">
        {recommendation.title}
      </p>
      <p className="font-body mt-0.5 truncate text-[12px] text-white/40">
        {recommendation.creator}
      </p>
      <p className="font-display mt-2 line-clamp-2 text-[11px] leading-relaxed text-teal-100/45">
        {recommendation.reason}
      </p>
    </button>
  );
}

export function MuseAiPicks({
  recommendations,
  batchRecommendations,
  title = "Muse AI Picks",
  description = "Curated next works from your cultural taste",
  className,
  variant = "default",
}: MuseAiPicksProps) {
  if (recommendations.length === 0) {
    return null;
  }

  const batch = batchRecommendations ?? recommendations;

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-teal-200/55" aria-hidden="true" />
            <h2 className="font-display text-xl font-bold tracking-tight text-white/90">
              {title}
            </h2>
          </div>
          {description ? (
            <p className="font-display text-sm text-white/40">{description}</p>
          ) : null}
        </div>
        {batch.length > recommendations.length || batch.length > 1 ? (
          <button
            type="button"
            onClick={() => openRecommendationBatch(batch.slice(0, 10))}
            className="shrink-0 text-[13px] text-white/42 transition-colors hover:text-white/70"
          >
            See More
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          "rounded-3xl border border-white/[0.08] bg-white/[0.035]",
          "p-4 shadow-[0_14px_40px_rgba(0,0,0,0.2)] backdrop-blur-xl md:p-5",
        )}
      >
        <div className="-mx-1 flex gap-3.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              compact={variant === "compact"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
