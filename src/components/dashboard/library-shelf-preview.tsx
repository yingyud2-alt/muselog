"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";

import { MemoryCover } from "@/components/calendar/memory-cover";
import { recentlyAdded as mockRecentlyAdded } from "@/components/dashboard/mock-data";
import { useLibraryItems } from "@/lib/library/use-library-items";
import { sortLibraryItems } from "@/lib/library/library-items";

export function LibraryShelfPreview() {
  const { allItems } = useLibraryItems();

  const items = useMemo(() => {
    const sorted = sortLibraryItems(allItems, "recently-added");
    if (sorted.length > 0) return sorted.slice(0, 5);

    return mockRecentlyAdded.slice(0, 5).map((item) => ({
      mediaKey: item.title,
      title: item.title,
      cover: item.coverClassName,
    }));
  }, [allItems]);

  return (
    <section className="py-2">
      <Link
        href="/library"
        className="group flex items-center gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-md transition hover:border-white/12 hover:bg-white/[0.045] md:gap-6 md:px-6 md:py-5"
      >
        <div className="shrink-0">
          <p className="font-display text-sm font-bold text-white/85">Library</p>
          <p className="font-display mt-0.5 text-xs text-white/40">Your collection</p>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5 overflow-hidden md:gap-3">
          {items.map((item) => (
            <MemoryCover
              key={item.mediaKey}
              cover={item.cover}
              title={item.title}
              className="w-11 shrink-0 rounded-lg md:w-12"
            />
          ))}
        </div>

        <span className="font-display inline-flex shrink-0 items-center gap-1 text-sm font-bold text-white/50 transition group-hover:text-white/78">
          View Library
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </span>
      </Link>
    </section>
  );
}
