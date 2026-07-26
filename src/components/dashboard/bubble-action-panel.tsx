"use client";

import { useCallback } from "react";

import { BubbleJournalForm } from "@/components/dashboard/bubble-journal-form";
import type { WorkBubble } from "@/components/dashboard/mood-bubble-data";
import { WorkStatusActions } from "@/components/work-status-actions";
import {
  resolveBubbleMediaKey,
} from "@/lib/content/bubble-content-bridge";
import { useBubbleMediaState } from "@/lib/content/user-media-state";
import type { ContentType } from "@/lib/content/types";

export type BubbleSubPanel = "none" | "journal" | "rating";

type BubbleActionPanelProps = {
  work: WorkBubble;
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

export function BubbleActionPanel({
  work,
  subPanel: controlledSubPanel,
  onSubPanelChange,
  presentation = "nested",
}: BubbleActionPanelProps) {
  const { state, saveJournal } = useBubbleMediaState(work);
  const mediaKey = resolveBubbleMediaKey(work);

  const setSubPanel = useCallback(
    (next: BubbleSubPanel) => {
      onSubPanelChange?.(next);
    },
    [onSubPanelChange],
  );

  const subPanel = controlledSubPanel ?? "none";

  if (!state) return null;

  if (subPanel === "journal") {
    return (
      <BubbleJournalForm
        work={work}
        presentation={presentation}
        onCancel={() => setSubPanel("none")}
        onSave={(values) => {
          saveJournal(values);
          setSubPanel("none");
        }}
      />
    );
  }

  return (
    <div className="mt-7 space-y-3 md:mt-0">
      <WorkStatusActions
        workId={mediaKey}
        type={bubbleTypeToContentType(work.type)}
        title={work.title}
        creator={work.creator}
        variant="panel"
      />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setSubPanel("journal");
        }}
        className="flex h-[46px] w-full items-center justify-center rounded-full border border-white/16 bg-transparent text-sm text-white/72 transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 md:h-auto md:py-2.5"
      >
        Add to Journal
      </button>
    </div>
  );
}
