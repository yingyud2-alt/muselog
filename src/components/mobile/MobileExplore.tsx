"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { ContentCoverImage } from "@/components/explore/content-cover";
import { SearchBar } from "@/components/explore/search-bar";
import { CONTENT_CATALOG } from "@/lib/content/content-data";
import {
  contentMatchesExploreMood,
  EXPLORE_MOODS,
  type ExploreMood,
} from "@/lib/content/constants";
import { upsertMemory } from "@/lib/content/memory-store";
import type { Content } from "@/lib/content/types";
import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";
import { cn } from "@/lib/utils";

function MobileExploreCard({ content }: { content: Content }) {
  const router = useRouter();
  const reasonTags = content.tags.slice(0, 2).join(" / ");

  const handleAdd = () => {
    upsertMemory({
      contentId: content.id,
      status: "WANT",
    });
    router.push(`/explore/${content.id}`);
  };

  return (
    <article className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.035] shadow-[0_8px_32px_rgba(0,0,0,0.16)] backdrop-blur-md">
      <ContentCoverImage content={content} variant="list" className="rounded-none" />

      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-lg font-medium leading-snug text-white/92">
            {content.title}
          </h3>
          <p className="mt-0.5 text-sm text-white/48">{content.creator}</p>
        </div>

        <p className="text-sm leading-relaxed text-white/55">
          Because you liked:{" "}
          <span className="italic text-white/68">{reasonTags}</span>
        </p>

        <button
          type="button"
          onClick={handleAdd}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] py-2.5 text-sm text-white/82 transition-colors hover:bg-white/10"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add to MuseLog
        </button>
      </div>
    </article>
  );
}

export function MobileExplore() {
  const [exploreMood, setExploreMood] = useState<ExploreMood>("quiet");

  const items = useMemo(() => {
    return CONTENT_CATALOG.filter((item) =>
      contentMatchesExploreMood(item.tags, exploreMood),
    );
  }, [exploreMood]);

  return (
    <div
      className="min-h-[100svh] px-5 pt-[calc(env(safe-area-inset-top)+20px)]"
      style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
    >
      <header className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
          Explore
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/92">
          For your mood
        </h1>
        <p className="mt-2 text-sm text-white/48">
          Recommendations shaped by feeling, not popularity.
        </p>
      </header>

      <SearchBar className="mb-6" />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {EXPLORE_MOODS.map((mood) => (
          <button
            key={mood.id}
            type="button"
            onClick={() => setExploreMood(mood.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
              exploreMood === mood.id
                ? "border-white/25 bg-white/12 text-white"
                : "border-white/10 bg-white/[0.03] text-white/50",
            )}
          >
            {mood.label}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {items.map((content) => (
          <MobileExploreCard key={content.id} content={content} />
        ))}
      </div>
    </div>
  );
}
