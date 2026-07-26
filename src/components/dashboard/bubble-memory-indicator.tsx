"use client";

import { useMemo } from "react";

import type { WorkBubble } from "@/components/dashboard/mood-bubble-data";
import {
  resolveBubbleMediaKey,
  resolveJournalItemId,
} from "@/lib/content/bubble-content-bridge";
import {
  useUserMediaStateMap,
  type UserMediaStatus,
} from "@/lib/content/user-media-state";
import { useJournalEntries } from "@/lib/calendar/journal-store";
import { cn } from "@/lib/utils";

type BubbleMemoryIndicatorProps = {
  work: WorkBubble;
  className?: string;
};

function resolveStatus(
  work: WorkBubble,
  stateMap: ReturnType<typeof useUserMediaStateMap>,
  journalIds: Set<string>,
): UserMediaStatus {
  const mediaKey = resolveBubbleMediaKey(work);
  const journalId = resolveJournalItemId(mediaKey);
  const stored = stateMap[mediaKey];

  if (journalIds.has(journalId) || stored?.addedToJournal) {
    if (stored?.status === "FINISHED") return "FINISHED";
    if (stored?.status === "WANT") return "WANT";
    return "ONGOING";
  }

  if (stored?.status && stored.status !== "NONE") {
    return stored.status;
  }

  return "NONE";
}

export function BubbleMemoryIndicator({
  work,
  className,
}: BubbleMemoryIndicatorProps) {
  const stateMap = useUserMediaStateMap();
  const { entries } = useJournalEntries();

  const journalIds = useMemo(
    () => new Set(entries.map((entry) => entry.id)),
    [entries],
  );

  const status = resolveStatus(work, stateMap, journalIds);
  const progress = stateMap[resolveBubbleMediaKey(work)]?.progress ?? 0;

  if (status === "NONE") return null;

  if (status === "WANT") {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute right-[10%] top-[10%] size-2.5 rounded-full",
          "border border-white/45 bg-transparent",
          className,
        )}
      />
    );
  }

  if (status === "ONGOING") {
    const clamped = Math.min(100, Math.max(12, progress || 35));
    const angle = (clamped / 100) * 360;

    return (
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute right-[8%] top-[8%] size-3.5 rounded-full",
          className,
        )}
        style={{
          background: `conic-gradient(rgba(255,255,255,0.55) ${angle}deg, rgba(255,255,255,0.12) 0deg)`,
          WebkitMask:
            "radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))",
        }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 rounded-full",
        "shadow-[0_0_18px_rgba(255,255,255,0.18),inset_0_0_12px_rgba(255,255,255,0.08)]",
        className,
      )}
    />
  );
}
