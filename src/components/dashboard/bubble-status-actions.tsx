"use client";

import { Check, Plus } from "lucide-react";

import {
  getBubbleActionLabels,
  getCompactRateLabel,
  getCompactWantLabel,
} from "@/components/dashboard/bubble-action-labels";
import { MemoryStars } from "@/components/calendar/memory-stars";
import type { WorkBubble } from "@/components/dashboard/mood-bubble-data";
import {
  findCatalogContentForBubble,
  resolveBubbleMediaKey,
} from "@/lib/content/bubble-content-bridge";
import { openJournalQuickLog } from "@/lib/detail/detail-overlay-store";
import type { UserMediaState } from "@/lib/content/user-media-state";
import type { ContentType } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type BubbleStatusActionsProps = {
  work: WorkBubble;
  state: UserMediaState;
  onAddToJournal: () => void;
  onToggleWant: () => void;
  onOpenRating: () => void;
  className?: string;
};

function bubbleTypeToContentType(type: WorkBubble["type"]): ContentType {
  const normalized = String(type).toUpperCase();
  if (normalized === "MOVIE") return "MOVIE";
  if (normalized === "MUSIC") return "MUSIC";
  return "BOOK";
}

function openBubbleQuickLog(work: WorkBubble) {
  const mediaKey = resolveBubbleMediaKey(work);
  const contentType = bubbleTypeToContentType(work.type);
  const catalog = findCatalogContentForBubble(work);
  openJournalQuickLog(mediaKey, {
    snapshot: {
      title: work.title,
      creator: work.creator,
      type: contentType,
      cover: catalog?.cover,
      description: work.quote,
    },
  });
}

export function BubbleStatusActions({
  work,
  state,
  onAddToJournal: _onAddToJournal,
  onToggleWant,
  onOpenRating,
  className,
}: BubbleStatusActionsProps) {
  const labels = getBubbleActionLabels(work.type);
  const compactWant = getCompactWantLabel(work.type);
  const compactRate = getCompactRateLabel(work.type);
  const isFinished = state.status === "FINISHED";
  const isOngoing = state.status === "ONGOING";
  const isWant = state.status === "WANT";

  const stop = (event: React.MouseEvent) => event.stopPropagation();

  if (isFinished) {
    return (
      <div className={cn("mt-7 space-y-3 md:mt-0", className)}>
        {state.rating && state.rating > 0 && (
          <div className="flex justify-center md:justify-start">
            <MemoryStars rating={state.rating} size="md" />
          </div>
        )}
        <p className="text-center text-sm font-medium text-white/72 md:text-left">
          {labels.finished}
        </p>
        <button
          type="button"
          aria-label="Add to Journal"
          onClick={(event) => {
            stop(event);
            openBubbleQuickLog(work);
          }}
          className="flex h-[48px] w-full items-center justify-center rounded-full border border-white/18 bg-white/[0.08] text-sm text-white/82 transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 md:h-auto md:py-2.5"
        >
          Add to Journal
        </button>
      </div>
    );
  }

  if (isOngoing) {
    return (
      <div className={cn("mt-7 space-y-3 md:mt-0", className)}>
        <button
          type="button"
          aria-label={labels.continueInJournal}
          onClick={(event) => {
            stop(event);
            openBubbleQuickLog(work);
          }}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-white/95 text-sm font-medium text-black transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 md:h-auto md:py-2.5"
        >
          {labels.continueInJournal}
        </button>

        <div className="flex items-center justify-center md:justify-start">
          <span className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-white/55">
            {labels.ongoing}
          </span>
        </div>

        <button
          type="button"
          aria-label={labels.finishRate}
          onClick={(event) => {
            stop(event);
            onOpenRating();
          }}
          className="flex h-[46px] w-full items-center justify-center rounded-full border border-white/16 bg-white/[0.08] text-sm text-white/82 transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 md:h-auto md:py-2.5"
        >
          {labels.finishRate}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("mt-7 space-y-2.5 md:mt-0 md:space-y-2.5", className)}>
      <button
        type="button"
        aria-label={labels.addToJournal}
        onClick={(event) => {
          stop(event);
          openBubbleQuickLog(work);
        }}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-white/95 text-sm font-medium text-black transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 md:h-auto md:py-2.5"
      >
        <Plus size={18} aria-hidden="true" />
        {labels.addToJournal}
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-label={isWant ? labels.wantActive : labels.want}
          aria-pressed={isWant}
          onClick={(event) => {
            stop(event);
            onToggleWant();
          }}
          className={cn(
            "flex h-[46px] items-center justify-center gap-1.5 rounded-full border px-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 md:h-auto md:py-2.5 md:text-sm",
            isWant
              ? "border-white/24 bg-white/[0.06] text-white/78"
              : "border-white/16 bg-transparent text-white/72 hover:bg-white/[0.05]",
          )}
        >
          {isWant && <Check className="size-3.5 shrink-0" aria-hidden="true" />}
          <span className="truncate">
            {isWant ? labels.wantActive : compactWant}
          </span>
        </button>

        <button
          type="button"
          aria-label={labels.completedRate}
          onClick={(event) => {
            stop(event);
            onOpenRating();
          }}
          className="flex h-[46px] items-center justify-center rounded-full border border-white/10 bg-white/[0.08] px-2 text-[13px] text-white/82 transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 md:h-auto md:py-2.5 md:text-sm"
        >
          <span className="truncate">{compactRate}</span>
        </button>
      </div>
    </div>
  );
}
