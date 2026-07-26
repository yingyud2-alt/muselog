"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MemoryCover } from "@/components/calendar/memory-cover";
import {
  DashboardGlassCard,
  DashboardSectionHeader,
} from "@/components/dashboard/dashboard-glass-card";
import { recentlyAdded as mockRecentlyAdded } from "@/components/dashboard/mock-data";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import type { LibraryItem } from "@/lib/library/library-types";

type RecentlyAddedPreviewProps = {
  items: LibraryItem[];
};

export function RecentlyAddedPreview({ items }: RecentlyAddedPreviewProps) {
  const displayItems =
    items.length > 0
      ? items.map((item) => ({
          id: item.mediaKey,
          title: item.title,
          cover: item.cover,
          typeLabel: CONTENT_TYPE_LABELS[item.type],
        }))
      : mockRecentlyAdded.slice(0, 6).map((item) => ({
          id: item.title,
          title: item.title,
          cover: item.coverClassName,
          typeLabel: item.type === "movie" ? "Movie" : "Book",
        }));

  return (
    <section className="space-y-4">
      <DashboardSectionHeader
        title="Recently Added"
        description="Fresh additions to your library"
        action={
          <Link
            href="/library"
            className="inline-flex items-center gap-1 text-sm text-white/45 transition hover:text-white/72"
          >
            View all
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        }
      />

      <DashboardGlassCard className="p-4 md:p-5">
        <div className="flex gap-4 overflow-x-auto pb-1">
          {displayItems.map((item) => (
            <Link
              key={item.id}
              href="/library"
              className="group w-[100px] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15 md:w-[108px]"
            >
              <MemoryCover
                cover={item.cover}
                title={item.title}
                className="w-full rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <p className="mt-2 truncate text-xs font-medium text-white/78">
                {item.title}
              </p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/32">
                {item.typeLabel}
              </p>
            </Link>
          ))}
        </div>
      </DashboardGlassCard>
    </section>
  );
}
