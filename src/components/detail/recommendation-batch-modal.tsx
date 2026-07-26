"use client";

import { useRouter } from "next/navigation";

import { LibraryArchiveCover } from "@/components/library/library-archive-cover";
import { LibraryPanelShell } from "@/components/library/library-panel-shell";
import { formatRecommendationWhy } from "@/components/library/library-recommendation-utils";
import { WorkStatusActions } from "@/components/work-status-actions";
import type { Recommendation } from "@/lib/ai/recommendation-engine";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import {
  closeAllDetails,
  closeDetail,
  openRecommendationDetail,
} from "@/lib/detail/detail-overlay-store";
import { navigateToWorkDetail } from "@/lib/navigation/navigate-to-work";

type RecommendationBatchModalProps = {
  recommendations: Recommendation[];
  onClose?: () => void;
  lockScroll?: boolean;
  zIndex?: number;
};

function BatchRow({ recommendation }: { recommendation: Recommendation }) {
  const router = useRouter();

  const openFullDetails = () => {
    navigateToWorkDetail(router, recommendation.id);
  };

  return (
    <li className="flex gap-4 border-b border-white/[0.06] py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => openRecommendationDetail(recommendation)}
        className="w-[64px] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15"
        aria-label={`Preview ${recommendation.title}`}
      >
        <LibraryArchiveCover
          cover={recommendation.cover}
          title={recommendation.title}
          className="rounded-[10px] shadow-none"
        />
      </button>

      <div className="min-w-0 flex-1">
        <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/32">
          {CONTENT_TYPE_LABELS[recommendation.type]}
        </p>
        <p className="mt-1 truncate text-[15px] font-medium text-white/90">
          {recommendation.title}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-white/42">
          {recommendation.creator}
        </p>
        <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-white/48">
          {formatRecommendationWhy(recommendation)}
        </p>

        <div className="mt-3 space-y-2">
          <WorkStatusActions
            workId={recommendation.id}
            type={recommendation.type}
            title={recommendation.title}
            creator={recommendation.creator}
            cover={recommendation.cover}
            variant="compact"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                closeAllDetails();
                router.push("/calendar");
              }}
              className="rounded-full border border-white/10 px-3.5 py-1.5 text-[12px] text-white/55 hover:border-white/22"
            >
              + Journal
            </button>
            <button
              type="button"
              onClick={openFullDetails}
              className="rounded-full border border-white/10 px-3.5 py-1.5 text-[12px] text-white/45 hover:border-white/22"
            >
              View Details →
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * Batch AI recommendation collection — stays in-place, no forced navigation.
 */
export function RecommendationBatchModal({
  recommendations,
  onClose = closeDetail,
  lockScroll = false,
  zIndex = 72,
}: RecommendationBatchModalProps) {
  return (
    <LibraryPanelShell
      open={recommendations.length > 0}
      title="AI Curated Collection"
      onClose={onClose}
      wide
      lockScroll={lockScroll}
      zIndex={zIndex}
    >
      <div>
        <h2 className="font-display text-[22px] font-semibold tracking-tight text-white/92">
          More recommendations
        </h2>
        <p className="mt-1.5 text-sm text-white/40">
          A quiet collection drawn from your archive patterns
        </p>

        <ul className="mt-5">
          {recommendations.map((recommendation) => (
            <BatchRow
              key={recommendation.id}
              recommendation={recommendation}
            />
          ))}
        </ul>
      </div>
    </LibraryPanelShell>
  );
}
