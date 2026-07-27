"use client";

import { useId, useState } from "react";

import { ContentCoverImage } from "@/components/explore/content-cover";
import { MediaIcon } from "@/components/dashboard/mood-bubble-shared";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import type { Content } from "@/lib/content/types";
import { openJournalQuickLog } from "@/lib/detail/detail-overlay-store";
import { openExploreContent } from "@/lib/explore/open-explore-work";
import { cn } from "@/lib/utils";
import {
  getImportedWorkById,
  useImportedWorkMap,
} from "@/lib/work/imported-work-catalog";
import {
  setWorkStatus,
  wantLabelForType,
} from "@/lib/work/work-status";

type ContentCardProps = {
  content: Content;
  isSaved?: boolean;
  className?: string;
};

function formatExternalRating(
  value: number,
  scale: number,
  source: string,
): string {
  const rounded = Math.round(value * 10) / 10;
  const label =
    source === "open_library"
      ? "OL"
      : source.replace(/_/g, " ").slice(0, 12);
  return `${rounded}/${scale} · ${label}`;
}

/**
 * Dense Explore feed card.
 * Compact by default; expands in-place for description + actions.
 * Card surface still opens Work Detail Modal (unchanged navigation).
 */
export function ContentCard({
  content,
  isSaved = false,
  className,
}: ContentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const importedMap = useImportedWorkMap();

  const imported =
    importedMap[content.id] ?? getImportedWorkById(content.id);
  const coverUrl = imported?.coverUrl || content.cover;
  const description =
    imported?.description?.trim() || content.description.trim() || "";
  const rawTags = (
    imported?.moodTags?.length
      ? imported.moodTags
      : imported?.genres?.length
        ? imported.genres
        : content.tags
  ).filter(Boolean);
  // Prefer short mood-like labels over long subject strings.
  const tags = rawTags.filter((tag) => tag.length <= 16);
  const visibleTags = (tags.length > 0 ? tags : rawTags).slice(
    0,
    expanded ? 8 : 3,
  );
  const rating = imported?.externalRatings?.[0];
  const wantLabel = wantLabelForType(content.type);

  const openDetail = () => openExploreContent(content);

  const toggleExpand = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setExpanded((value) => !value);
  };

  const onWant = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setWorkStatus(
      {
        id: content.id,
        type: content.type,
        title: content.title,
        creator: content.creator,
        coverUrl,
      },
      { status: "want" },
    );
  };

  const onJournal = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    openJournalQuickLog(content.id, {
      snapshot: {
        title: content.title,
        creator: content.creator,
        type: content.type,
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
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open ${content.title}`}
      aria-expanded={expanded}
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetail();
        }
      }}
      className={cn(
        "group flex cursor-pointer flex-col overflow-hidden rounded-2xl border",
        "backdrop-blur-md transition-[border-color,background-color,box-shadow,transform] duration-300 ease-out",
        expanded
          ? "border-white/16 bg-white/[0.07] shadow-[0_12px_36px_rgba(0,0,0,0.28)]"
          : "border-white/10 bg-white/[0.04] hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.055]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
        className,
      )}
    >
      <div className="block w-full shrink-0">
        <ContentCoverImage
          content={{
            title: content.title,
            cover: coverUrl,
            coverUrl,
          }}
          variant="compact"
          hideTitle
          className="rounded-none rounded-t-2xl"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3.5 pb-3 pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-white/42">
            <MediaIcon
              type={content.type}
              className="size-3"
              style={{ opacity: 0.7 }}
            />
            <span>{CONTENT_TYPE_LABELS[content.type]}</span>
          </div>
          <div className="flex items-center gap-2">
            {rating ? (
              <span className="text-[10px] tabular-nums text-white/45">
                {formatExternalRating(rating.value, rating.scale, rating.source)}
              </span>
            ) : null}
            {isSaved ? (
              <span className="text-[10px] text-white/35">Saved</span>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 space-y-0.5">
          <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-white/92">
            {content.title}
          </h3>
          <p className="truncate text-xs text-white/45">{content.creator}</p>
        </div>

        {visibleTags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/40"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        {/* Expandable panel — height animates via grid 0fr → 1fr */}
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
                "space-y-3 border-t border-white/[0.06] pt-3",
                "transition-opacity duration-300 ease-out",
                expanded ? "opacity-100" : "opacity-0",
              )}
            >
              {description ? (
                <p className="font-quote line-clamp-4 text-[13px] italic leading-relaxed text-white/58">
                  &ldquo;{description}&rdquo;
                </p>
              ) : null}

              <div
                className="flex flex-wrap gap-2"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={onWant}
                  className="rounded-full border border-white/14 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/72 transition-colors hover:border-white/24 hover:bg-white/[0.08] hover:text-white/90"
                >
                  {wantLabel}
                </button>
                <button
                  type="button"
                  onClick={onJournal}
                  className="rounded-full border border-white/14 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/72 transition-colors hover:border-white/24 hover:bg-white/[0.08] hover:text-white/90"
                >
                  Add to Journal
                </button>
                <button
                  type="button"
                  onClick={onViewDetails}
                  className="rounded-full border border-white/18 bg-white/[0.08] px-3 py-1.5 text-[11px] text-white/88 transition-colors hover:bg-white/[0.12]"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={toggleExpand}
          className={cn(
            "mt-0.5 self-start text-[11px] tracking-wide transition-colors",
            expanded
              ? "text-white/55 hover:text-white/75"
              : "text-white/40 hover:text-white/65",
          )}
        >
          {expanded ? "See Less" : "See More"}
        </button>
      </div>
    </article>
  );
}
