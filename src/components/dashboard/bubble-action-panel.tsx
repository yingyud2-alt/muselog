"use client";

import { useCallback } from "react";

import { BubbleJournalForm } from "@/components/dashboard/bubble-journal-form";
import { BubbleRatingSheet } from "@/components/dashboard/bubble-rating-sheet";
import { BubbleStatusActions } from "@/components/dashboard/bubble-status-actions";
import type { WorkBubble } from "@/components/dashboard/mood-bubble-data";
import { useBubbleMediaState } from "@/lib/content/user-media-state";

export type BubbleSubPanel = "none" | "journal" | "rating";

type BubbleActionPanelProps = {
  work: WorkBubble;
  subPanel?: BubbleSubPanel;
  onSubPanelChange?: (panel: BubbleSubPanel) => void;
};

export function BubbleActionPanel({
  work,
  subPanel: controlledSubPanel,
  onSubPanelChange,
}: BubbleActionPanelProps) {
  const { state, saveJournal, saveRating, toggleWant } =
    useBubbleMediaState(work);

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
        onCancel={() => setSubPanel("none")}
        onSave={(values) => {
          saveJournal(values);
          setSubPanel("none");
        }}
      />
    );
  }

  if (subPanel === "rating") {
    return (
      <BubbleRatingSheet
        work={work}
        initialRating={state.rating}
        onCancel={() => setSubPanel("none")}
        onSave={(values) => {
          saveRating(values);
          setSubPanel("none");
        }}
      />
    );
  }

  return (
    <BubbleStatusActions
      work={work}
      state={state}
      onAddToJournal={() => setSubPanel("journal")}
      onToggleWant={toggleWant}
      onOpenRating={() => setSubPanel("rating")}
    />
  );
}
