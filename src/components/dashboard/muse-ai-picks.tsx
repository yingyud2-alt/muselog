"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import {
  DashboardGlassCard,
  DashboardSectionHeader,
} from "@/components/dashboard/dashboard-glass-card";
import { MediaCover } from "@/components/dashboard/media-cover";
import type { AiPickItem } from "@/components/dashboard/mock-data";
import { CONTENT_CATALOG } from "@/lib/content/content-data";
import { cn } from "@/lib/utils";

type MusePickCardProps = {
  pick: AiPickItem;
  likedTitle: string;
};

function MusePickCard({ pick, likedTitle }: MusePickCardProps) {
  const catalogMatch = CONTENT_CATALOG.find(
    (entry) => entry.title.toLowerCase() === pick.title.toLowerCase(),
  );
  const href = catalogMatch ? `/explore/${catalogMatch.id}` : "/explore";

  return (
    <Link
      href={href}
      className={cn(
        "group block shrink-0 rounded-2xl border border-white/[0.07] bg-white/[0.025]",
        "p-4 transition hover:border-white/12 hover:bg-white/[0.04]",
        "w-[220px] md:w-[240px]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.14em] text-white/35">
          {pick.categoryLabel}
        </span>
        <Sparkles
          className="size-3.5 text-white/30 transition group-hover:text-white/55"
          aria-hidden="true"
        />
      </div>

      <MediaCover
        title={pick.title}
        variant="compact"
        className={cn(
          "mt-3 w-full rounded-xl",
          pick.type === "book"
            ? "from-neutral-600 via-neutral-700 to-neutral-900"
            : pick.type === "movie"
              ? "from-neutral-500 via-neutral-700 to-neutral-800"
              : "from-neutral-400 via-neutral-600 to-neutral-800",
        )}
      />

      <p className="mt-3 text-[11px] text-white/40">
        Because you liked{" "}
        <span className="text-white/58">{likedTitle}</span>
      </p>
      <p className="mt-1 truncate text-sm font-medium text-white/88">
        {pick.title}
      </p>
      <p className="mt-0.5 truncate text-xs text-white/42">{pick.creator}</p>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/45">
        {pick.reason}
      </p>
    </Link>
  );
}

type MuseAiPicksProps = {
  picks: AiPickItem[];
  likedTitle: string;
};

export function MuseAiPicks({ picks, likedTitle }: MuseAiPicksProps) {
  return (
    <section className="space-y-4">
      <DashboardSectionHeader
        title="Muse AI Picks"
        description="Personal recommendations from your taste"
      />

      <DashboardGlassCard className="p-4 md:p-5">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {picks.map((pick) => (
            <MusePickCard key={pick.title} pick={pick} likedTitle={likedTitle} />
          ))}
        </div>
      </DashboardGlassCard>
    </section>
  );
}
