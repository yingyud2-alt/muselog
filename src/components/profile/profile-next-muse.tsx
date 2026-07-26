"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import { MemoryCover } from "@/components/calendar/memory-cover";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import type { MuseDiscoveryPreview } from "@/lib/profile/muse-profile-data";
import { cn } from "@/lib/utils";

const EXPAND_TRANSITION = {
  duration: 0.48,
  ease: [0.22, 1, 0.36, 1] as const,
};

const PREVIEW_COUNT = 5;

type ProfileNextMuseProps = {
  recommendations: MuseDiscoveryPreview[];
  className?: string;
};

export function ProfileNextMuse({
  recommendations,
  className,
}: ProfileNextMuseProps) {
  const [showAll, setShowAll] = useState(false);
  const panelId = useId();
  const preview = recommendations.slice(0, PREVIEW_COUNT);
  const more = recommendations.slice(PREVIEW_COUNT);
  const visible = showAll ? recommendations : preview;

  return (
    <section
      className={cn(
        "rounded-[24px] border border-white/[0.08] bg-white/[0.03]",
        "px-5 py-6 md:px-7 md:py-7",
        className,
      )}
      aria-label="Your Next Muse"
    >
      <p className="font-label text-[10px] uppercase tracking-[0.18em] text-white/35">
        Your Next Muse
      </p>
      <p className="mt-2 font-display text-sm text-white/42">
        Soft discoveries from your cultural identity
      </p>

      <ul className="mt-6 space-y-3">
        {visible.map((rec) => (
          <li key={rec.id}>
            <RecommendationCard recommendation={rec} />
          </li>
        ))}
      </ul>

      {more.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            aria-expanded={showAll}
            aria-controls={panelId}
            className={cn(
              "mt-5 inline-flex items-center font-display text-[13px] font-bold",
              "text-white/70 transition-colors hover:text-white/92",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
            )}
          >
            {showAll
              ? "Show fewer recommendations"
              : "See more recommendations →"}
          </button>

          <AnimatePresence initial={false}>
            {showAll ? (
              <motion.p
                id={panelId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={EXPAND_TRANSITION}
                className="mt-3 font-display text-[12px] text-white/35"
              >
                Showing {recommendations.length} recommendations from your
                archive
              </motion.p>
            ) : null}
          </AnimatePresence>
        </>
      ) : null}
    </section>
  );
}

function RecommendationCard({
  recommendation,
}: {
  recommendation: MuseDiscoveryPreview;
}) {
  return (
    <Link
      href={`/explore/${recommendation.id}`}
      className={cn(
        "flex gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5",
        "transition-colors hover:bg-white/[0.05]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15",
      )}
    >
      <MemoryCover
        cover={recommendation.cover}
        title={recommendation.title}
        className="w-14 shrink-0 rounded-xl"
      />
      <div className="min-w-0 flex-1 py-0.5">
        <p className="font-label text-[10px] uppercase tracking-[0.12em] text-white/32">
          {CONTENT_TYPE_LABELS[recommendation.type]}
        </p>
        <p className="font-display mt-1 truncate text-[14px] font-bold text-white/90">
          {recommendation.title}
        </p>
        <p className="truncate text-[12px] text-white/40">
          {recommendation.creator}
        </p>
        <p className="font-body mt-2 text-[12px] leading-relaxed text-white/52">
          {recommendation.reason}
        </p>
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {recommendation.tags.slice(0, 3).map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 font-label text-[10px] text-white/40"
            >
              <span aria-hidden="true">○</span>
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
