"use client";

import { RecommendationBatchModal } from "@/components/detail/recommendation-batch-modal";
import { JournalMemoryDetailModal } from "@/components/journal/journal-memory-detail-modal";
import { JournalQuickLogModal } from "@/components/journal/journal-quick-log-modal";
import { WorkDetailModal } from "@/components/work-detail-modal";
import { WorkPreviewModal } from "@/components/work-preview-modal";
import { useDetailOverlay } from "@/hooks/use-detail-overlay";
import { closeDetail } from "@/lib/detail/detail-overlay-store";

const BASE_Z = 70;

/**
 * Global host for in-place work overlays.
 * Explore / Library use WorkDetailModal; Journal calendar uses JournalMemoryDetailModal.
 * Scroll position is restored by the overlay store on close.
 */
export function DetailOverlayHost() {
  const { stack } = useDetailOverlay();

  if (stack.length === 0) return null;

  return (
    <>
      {stack.map((layer, index) => {
        const zIndex = BASE_Z + index * 4;

        if (layer.type === "detail") {
          return (
            <WorkDetailModal
              key={`detail-${layer.workId}-${index}`}
              workId={layer.workId}
              snapshot={layer.snapshot}
              onClose={closeDetail}
              lockScroll={false}
              zIndex={zIndex}
            />
          );
        }

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

        if (layer.type === "journal-memory-detail") {
          return (
            <JournalMemoryDetailModal
              key={`memory-${layer.entryId}-${index}`}
              entryId={layer.entryId}
              onClose={closeDetail}
              lockScroll={false}
              zIndex={zIndex}
            />
          );
        }

        if (layer.type === "journal-quick-log") {
          return (
            <JournalQuickLogModal
              key={`journal-${layer.workId || "new"}-${layer.entryId ?? ""}-${layer.initialDate ?? ""}-${index}`}
              workId={layer.workId}
              snapshot={layer.snapshot}
              initialDate={layer.initialDate}
              entryId={layer.entryId}
              onClose={closeDetail}
              lockScroll={false}
              zIndex={zIndex}
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
