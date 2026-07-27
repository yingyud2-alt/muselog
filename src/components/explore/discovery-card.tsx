"use client";

import { useId, useState } from "react";

import { ContentCoverImage } from "@/components/explore/content-cover";
import type {
  CommunityVoice,
  ExploreDiscoveryItem,
} from "@/lib/content/explore-discovery";
import { openJournalQuickLog } from "@/lib/detail/detail-overlay-store";
import { openExploreDiscoveryItem } from "@/lib/explore/open-explore-work";
import { cn } from "@/lib/utils";
import {
  getImportedWorkById,
  useImportedWorkMap,
} from "@/lib/work/imported-work-catalog";
import {
  setWorkStatus,
  wantLabelForType,
} from "@/lib/work/work-status";

const VOICE_LABELS: Record<CommunityVoice, string> = {
  reader: "Reader",
  creator: "Creator",
  critic: "Critic",
};

type DiscoveryCardProps = {
  item: ExploreDiscoveryItem;
  className?: string;
};

function formatExternalRating(
  value: number,
  scale: number,
): string {
  return `${Math.round(value * 10) / 10}/${scale}`;
}

/**
 * Compact discovery carousel card.
 * Default: cover + title + creator (+ rating).
 * Expand reveals reason / description + quick actions.
 * Card click still opens Work Detail Modal.
 */
export function DiscoveryCard({ item, className }: DiscoveryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const importedMap = useImportedWorkMap();

  const imported =
    (item.contentId
      ? importedMap[item.contentId] ?? getImportedWorkById(item.contentId)
      : null) ??
    importedMap[item.id] ??
    getImportedWorkById(item.id);
  const coverUrl =
    imported?.coverUrl || item.coverUrl || item.cover;
  const description =
    imported?.description?.trim() || item.reason.trim() || "";
  const rawTags = imported?.moodTags?.length
    ? imported.moodTags
    : imported?.genres ?? [];
  const tags = rawTags
    .filter((tag) => tag.trim().length > 0 && tag.length <= 16)
    .slice(0, expanded ? 6 : 2);
  const rating = imported?.externalRatings?.[0];
  const contentType =
    item.category === "film"
      ? "MOVIE"
      : item.category === "music"
        ? "MUSIC"
        : "BOOK";
  const wantLabel = wantLabelForType(contentType);
  const workId = imported?.id ?? item.contentId ?? item.id;

  const openDetail = () => openExploreDiscoveryItem(item);

  const toggleExpand = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setExpanded((value) => !value);
  };

  const onWant = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setWorkStatus(
      {
        id: workId,
        type: contentType,
        title: item.title,
        creator: item.creator,
        coverUrl,
      },
      { status: "want" },
    );
  };

  const onJournal = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    openJournalQuickLog(workId, {
      snapshot: {
        title: item.title,
        creator: item.creator,
        type: contentType,
        cover: coverUrl,
      },
    });
  };

  const onViewDetails = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    openDetail();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${item.title}`}
      aria-expanded={expanded}
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetail();
        }
      }}
      className={cn(
        "group w-[148px] shrink-0 cursor-pointer rounded-2xl border text-left",
        "backdrop-blur-md transition-[border-color,background-color,box-shadow,width,transform] duration-300 ease-out",
        expanded
          ? "w-[200px] border-white/16 bg-white/[0.07] shadow-[0_12px_32px_rgba(0,0,0,0.26)]"
          : "border-white/[0.08] bg-white/[0.035] hover:-translate-y-0.5 hover:border-white/14 hover:bg-white/[0.05]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200/20",
        className,
      )}
    >
      <div className="p-2.5 pb-0">
        <ContentCoverImage
          content={{
            title: item.title,
            cover: coverUrl,
            coverUrl,
          }}
          variant="compact"
          hideTitle
          className="rounded-xl"
        />
      </div>

      <div className="space-y-1 p-2.5 pt-1.5">
        {item.voice ? (
          <p className="font-label text-[9px] uppercase tracking-[0.14em] text-teal-100/40">
            {VOICE_LABELS[item.voice]}
          </p>
        ) : null}

        <h3 className="font-display line-clamp-2 text-[13px] font-normal leading-snug text-white/90">
          {item.title}
        </h3>

        <p className="font-label truncate text-[10px] text-white/40">
          {item.creator}
        </p>

        <div className="flex items-center justify-between gap-1 pt-0.5">
          {rating ? (
            <span className="text-[10px] tabular-nums text-white/42">
              {formatExternalRating(rating.value, rating.scale)}
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={toggleExpand}
            className="text-[10px] text-white/40 transition-colors hover:text-white/65"
          >
            {expanded ? "Less" : "More"}
          </button>
        </div>

        {tags.length > 0 && !expanded ? (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[9px] text-white/35">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        <div
          id={panelId}
          inert={expanded ? undefined : true}
          aria-hidden={!expanded}
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-out",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div
            className={cn(
              "min-h-0 overflow-hidden",
              !expanded && "pointer-events-none",
            )}
          >
            <div
              className={cn(
                "space-y-2 border-t border-white/[0.06] pt-2",
                "transition-opacity duration-300 ease-out",
                expanded ? "opacity-100" : "opacity-0",
              )}
            >
              {description ? (
                <p className="font-display line-clamp-3 text-[11px] leading-relaxed text-white/50">
                  {description}
                </p>
              ) : null}

              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span key={tag} className="text-[9px] text-white/38">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div
                className="flex flex-col gap-1.5"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={onWant}
                  className="rounded-full border border-white/12 px-2 py-1 text-[10px] text-white/70 transition-colors hover:bg-white/[0.06]"
                >
                  {wantLabel}
                </button>
                <button
                  type="button"
                  onClick={onJournal}
                  className="rounded-full border border-white/12 px-2 py-1 text-[10px] text-white/70 transition-colors hover:bg-white/[0.06]"
                >
                  Add to Journal
                </button>
                <button
                  type="button"
                  onClick={onViewDetails}
                  className="rounded-full border border-white/16 bg-white/[0.06] px-2 py-1 text-[10px] text-white/85 transition-colors hover:bg-white/[0.1]"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
