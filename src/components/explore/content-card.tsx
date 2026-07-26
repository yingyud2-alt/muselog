"use client";

import { ContentCoverImage } from "@/components/explore/content-cover";
import { MediaIcon } from "@/components/dashboard/mood-bubble-shared";
import { WorkStatusActions } from "@/components/work-status-actions";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import { openWorkDetail } from "@/lib/detail/detail-overlay-store";
import type { Content } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type ContentCardProps = {
  content: Content;
  isSaved?: boolean;
};

export function ContentCard({ content, isSaved = false }: ContentCardProps) {
  const openDetail = () => openWorkDetail(content.id);

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-white/10",
        "bg-white/[0.04] backdrop-blur-md transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06]",
      )}
    >
      <button type="button" onClick={openDetail} className="block w-full shrink-0 text-left">
        <ContentCoverImage content={content} />
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/45">
            <MediaIcon
              type={content.type}
              className="size-3.5"
              style={{ opacity: 0.7 }}
            />
            <span>{CONTENT_TYPE_LABELS[content.type]}</span>
          </div>
          {isSaved && (
            <span className="text-[10px] text-white/35">Saved</span>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-medium leading-snug text-white/92">
            <button
              type="button"
              onClick={openDetail}
              className="text-left transition-colors hover:text-white"
            >
              {content.title}
            </button>
          </h3>
          <p className="text-sm text-white/48">{content.creator}</p>
        </div>

        <p className="font-quote line-clamp-3 text-sm italic leading-relaxed text-white/58">
          &ldquo;{content.description}&rdquo;
        </p>

        {content.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {content.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[11px] text-white/38"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto">
          <WorkStatusActions
            workId={content.id}
            type={content.type}
            title={content.title}
            creator={content.creator}
            cover={content.cover}
            variant="compact"
          />
        </div>
      </div>
    </article>
  );
}
