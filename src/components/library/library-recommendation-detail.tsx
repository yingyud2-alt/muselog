"use client";

import { WorkPreviewModal } from "@/components/work-preview-modal";
import type { Recommendation } from "@/lib/ai/recommendation-engine";

type LibraryRecommendationDetailProps = {
  recommendation: Recommendation | null;
  onClose: () => void;
};

/** @deprecated Prefer openRecommendationDetail() + DetailOverlayHost. */
export function LibraryRecommendationDetail({
  recommendation,
  onClose,
}: LibraryRecommendationDetailProps) {
  return (
    <WorkPreviewModal
      workId={recommendation?.id ?? null}
      recommendation={recommendation}
      onClose={onClose}
      lockScroll
      showExploreMore
    />
  );
}
