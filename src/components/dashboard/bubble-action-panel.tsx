"use client";

import type { WorkBubble } from "@/components/dashboard/mood-bubble-data";
import { WorkStatusActions } from "@/components/work-status-actions";
import {
  findCatalogContentForBubble,
  resolveBubbleMediaKey,
} from "@/lib/content/bubble-content-bridge";
import { openJournalQuickLog } from "@/lib/detail/detail-overlay-store";
import type { ContentType } from "@/lib/content/types";

export type BubbleSubPanel = "none" | "journal" | "rating";

type BubbleActionPanelProps = {
  work: WorkBubble;
  /** @deprecated Sub-panels replaced by Journal Quick Log modal. */
  subPanel?: BubbleSubPanel;
  onSubPanelChange?: (panel: BubbleSubPanel) => void;
  /** nested = mobile sheet; panel = desktop glass modal */
  presentation?: "nested" | "panel";
};

function bubbleTypeToContentType(type: WorkBubble["type"]): ContentType {
  const normalized = String(type).toUpperCase();
  if (normalized === "MOVIE") return "MOVIE";
  if (normalized === "MUSIC") return "MUSIC";
  return "BOOK";
}

export function BubbleActionPanel({ work }: BubbleActionPanelProps) {
  const mediaKey = resolveBubbleMediaKey(work);
  const contentType = bubbleTypeToContentType(work.type);
  const catalog = findCatalogContentForBubble(work);

  return (
    <div className="mt-7 space-y-3 md:mt-0">
      <WorkStatusActions
        workId={mediaKey}
        type={contentType}
        title={work.title}
        creator={work.creator}
        cover={catalog?.cover}
        variant="panel"
      />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          openJournalQuickLog(mediaKey, {
            snapshot: {
              title: work.title,
              creator: work.creator,
              type: contentType,
              cover: catalog?.cover,
              description: work.quote,
            },
          });
        }}
        className="flex h-[46px] w-full items-center justify-center rounded-full border border-white/16 bg-transparent text-sm text-white/72 transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 md:h-auto md:py-2.5"
      >
        Add to Journal
      </button>
    </div>
  );
}
