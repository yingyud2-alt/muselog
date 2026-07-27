"use client";

import { ContentCoverImage } from "@/components/explore/content-cover";
import type { Content, CuratedList } from "@/lib/content/types";
import { openExploreContent } from "@/lib/explore/open-explore-work";
import { getExploreContentsByIds } from "@/lib/explore/explore-public-catalog";
import { cn } from "@/lib/utils";

type CuratedListCardProps = {
  list: CuratedList;
};

/**
 * Renders a curated list shell. Item ids come from the Explore adapter
 * (API work ids when public catalog is available; mock ids only as fallback).
 */
export function CuratedListCard({ list }: CuratedListCardProps) {
  const previewItems = getExploreContentsByIds(list.items).slice(0, 3);
  const coverContent = {
    title: list.title,
    cover: previewItems[0]?.cover || list.cover,
    coverUrl: previewItems[0]?.cover || list.cover,
  };

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]",
        "backdrop-blur-md transition-colors hover:border-white/15 hover:bg-white/[0.06]",
      )}
    >
      <ContentCoverImage content={coverContent} variant="list" />

      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-base font-medium text-white/90">{list.title}</h3>
          <p className="mt-1 text-xs text-white/42">
            {list.items.length} {list.items.length === 1 ? "work" : "works"}
          </p>
        </div>

        <ul className="space-y-1.5 border-t border-white/8 pt-3">
          {previewItems.map((item: Content) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => openExploreContent(item)}
                aria-label={`Open ${item.title}`}
                className="w-full rounded-md px-1 py-1.5 text-left text-sm text-white/62 transition-colors hover:bg-white/[0.04] hover:text-white/88"
              >
                {item.title}
              </button>
            </li>
          ))}
        </ul>

        <p className="text-xs leading-relaxed text-white/40">{list.description}</p>
      </div>
    </article>
  );
}
