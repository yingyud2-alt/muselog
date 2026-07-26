"use client";

import { RecommendationBatchModal } from "@/components/detail/recommendation-batch-modal";
import { WorkPreviewModal } from "@/components/work-preview-modal";
import { useDetailOverlay } from "@/hooks/use-detail-overlay";
import { closeDetail } from "@/lib/detail/detail-overlay-store";

const BASE_Z = 70;

/**
 * Global host for lightweight preview overlays.
 * Full archive lives at /work/[id] via View Details.
 */
export function DetailOverlayHost() {
  const { stack } = useDetailOverlay();

  if (stack.length === 0) return null;

  return (
    <>
      {stack.map((layer, index) => {
        const zIndex = BASE_Z + index * 4;

        if (layer.type === "preview") {
          return (
            <WorkPreviewModal
              key={`preview-${layer.workId}-${index}`}
              workId={layer.workId}
              recommendation={layer.recommendation}
              snapshot={layer.snapshot}
              onClose={closeDetail}
              lockScroll={false}
              zIndex={zIndex}
              showExploreMore={Boolean(layer.recommendation)}
            />
          );
        }

        return (
          <RecommendationBatchModal
            key={`batch-${index}`}
            recommendations={layer.recommendations}
            onClose={closeDetail}
            lockScroll={false}
            zIndex={zIndex}
          />
        );
      })}
    </>
  );
}
