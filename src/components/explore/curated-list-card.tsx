"use client";

import { ContentCoverImage } from "@/components/explore/content-cover";
import { getContentsByIds } from "@/lib/content/content-data";
import { openWorkDetail } from "@/lib/detail/detail-overlay-store";
import type { CuratedList } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type CuratedListCardProps = {
  list: CuratedList;
};

export function CuratedListCard({ list }: CuratedListCardProps) {
  const previewItems = getContentsByIds(list.items).slice(0, 3);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]",
        "backdrop-blur-md transition-colors hover:border-white/15 hover:bg-white/[0.06]",
      )}
    >
      <ContentCoverImage
        content={{ title: list.title, cover: list.cover }}
        variant="list"
      />

      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-base font-medium text-white/90">{list.title}</h3>
          <p className="mt-1 text-xs text-white/42">
            {list.items.length} {list.items.length === 1 ? "work" : "works"}
          </p>
        </div>

        <ul className="space-y-1.5 border-t border-white/8 pt-3">
          {previewItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => openWorkDetail(item.id)}
                className="text-left text-sm text-white/62 transition-colors hover:text-white/88"
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
