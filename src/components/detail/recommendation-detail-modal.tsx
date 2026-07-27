"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { MediaIcon } from "@/components/dashboard/mood-bubble-shared";
import { LibraryArchiveCover } from "@/components/library/library-archive-cover";
import { LibraryMoodTags } from "@/components/library/library-mood-tags";
import { LibraryPanelShell } from "@/components/library/library-panel-shell";
import {
  buildRecommendationAnalysis,
  formatRecommendationWhy,
  formatTasteAlignment,
} from "@/components/library/library-recommendation-utils";
import { WorkStatusActions } from "@/components/work-status-actions";
import type { Recommendation } from "@/lib/ai/recommendation-engine";
import { CONTENT_TYPE_LABELS, CREATOR_LABELS } from "@/lib/content/constants";
import { getContentById } from "@/lib/content/content-data";
import {
  closeAllDetails,
  closeDetail,
  openJournalQuickLog,
  openRecommendationBatch,
} from "@/lib/detail/detail-overlay-store";
import { navigateToWorkDetail } from "@/lib/navigation/navigate-to-work";
import { cn } from "@/lib/utils";

type RecommendationDetailModalProps = {
  recommendation: Recommendation | null;
  onClose?: () => void;
  batchRecommendations?: Recommendation[];
  lockScroll?: boolean;
  zIndex?: number;
};

function creatorRole(type: Recommendation["type"]): string {
  return CREATOR_LABELS[type];
}

function RecommendationBody({
  recommendation,
  batchRecommendations,
}: {
  recommendation: Recommendation;
  batchRecommendations?: Recommendation[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const why = formatRecommendationWhy(recommendation);
  const taste = formatTasteAlignment(recommendation);
  const analysis = buildRecommendationAnalysis(recommendation);
  const description =
    getContentById(recommendation.id)?.description ??
    "A quiet match drawn from the patterns in your archive.";

  return (
    <div className="md:flex md:gap-8 md:pr-6">
      <div className="mx-auto w-[180px] shrink-0 md:mx-0 md:w-[210px]">
        <LibraryArchiveCover
          cover={recommendation.cover}
          title={recommendation.title}
          className="rounded-[16px]"
        />
      </div>

      <div className="mt-5 min-w-0 flex-1 md:mt-0">
        <div className="flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.16em] text-white/40">
          <MediaIcon
            type={recommendation.type}
            className="size-3.5"
            style={{ opacity: 0.7 }}
          />
          <span>{CONTENT_TYPE_LABELS[recommendation.type]}</span>
        </div>

        <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight text-white/94 md:text-[30px]">
          {recommendation.title}
        </h2>
        <p className="mt-1.5 text-[14px] text-white/48">
          <span className="text-white/32">
            {creatorRole(recommendation.type)} ·{" "}
          </span>
          {recommendation.creator}
        </p>

        <div className="mt-5 space-y-3">
          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/32">
              Why AI recommends this
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-white/62">{why}</p>
          </div>

          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/32">
              Similar to your taste
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-white/55">
              {taste}
            </p>
          </div>

          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/32">
              Mood keywords
            </p>
            <LibraryMoodTags
              tags={recommendation.tags.slice(0, 4)}
              className="mt-2"
            />
          </div>

          <p className="text-[14px] leading-relaxed text-white/50">
            {description}
          </p>
        </div>

        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className={cn(
            "mt-5 inline-flex items-center gap-1.5 text-[13px] text-white/48",
            "transition-colors hover:text-white/72",
          )}
        >
          AI analysis
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform",
              expanded && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        {expanded ? (
          <div className="mt-3 space-y-2.5 border-l border-white/[0.08] pl-4">
            <p className="text-[13px] leading-relaxed text-white/52">
              <span className="text-white/35">Narrative style — </span>
              {analysis.narrative}
            </p>
            <p className="text-[13px] leading-relaxed text-white/52">
              <span className="text-white/35">Emotional similarity — </span>
              {analysis.emotional}
            </p>
            <p className="text-[13px] leading-relaxed text-white/52">
              <span className="text-white/35">Visual atmosphere — </span>
              {analysis.atmosphere}
            </p>
            <p className="text-[13px] leading-relaxed text-white/52">
              <span className="text-white/35">Related works — </span>
              {analysis.related}
            </p>
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <WorkStatusActions
            workId={recommendation.id}
            type={recommendation.type}
            title={recommendation.title}
            creator={recommendation.creator}
            cover={recommendation.cover}
            variant="panel"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                openJournalQuickLog(recommendation.id, {
                  snapshot: {
                    title: recommendation.title,
                    creator: recommendation.creator,
                    type: recommendation.type,
                    cover: recommendation.cover,
                    tags: recommendation.tags?.slice(0, 4),
                    description: recommendation.reason,
                  },
                })
              }
              className="rounded-full border border-white/14 px-5 py-2.5 text-sm text-white/72"
            >
              + Add to Journal
            </button>
            <button
              type="button"
              onClick={() => navigateToWorkDetail(router, recommendation.id)}
              className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/48 transition-colors hover:text-white/70"
            >
              View Details →
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          {batchRecommendations && batchRecommendations.length > 1 ? (
            <button
              type="button"
              onClick={() => openRecommendationBatch(batchRecommendations)}
              className="text-[13px] text-white/45 transition-colors hover:text-white/70"
            >
              See More
            </button>
          ) : null}
          <Link
            href="/explore"
            onClick={() => closeAllDetails()}
            className="text-[13px] text-white/40 transition-colors hover:text-white/68"
          >
            Explore More Recommendations →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function RecommendationDetailModal({
  recommendation,
  onClose = closeDetail,
  batchRecommendations,
  lockScroll = false,
  zIndex = 70,
}: RecommendationDetailModalProps) {
  return (
    <LibraryPanelShell
      open={Boolean(recommendation)}
      title={recommendation?.title ?? "Recommendation"}
      onClose={onClose}
      wide
      lockScroll={lockScroll}
      zIndex={zIndex}
    >
      {recommendation ? (
        <RecommendationBody
          key={recommendation.id}
          recommendation={recommendation}
          batchRecommendations={batchRecommendations}
        />
      ) : null}
    </LibraryPanelShell>
  );
}
