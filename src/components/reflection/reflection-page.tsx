"use client";

import { useMemo, useState } from "react";

import { MediaFloatingDetail } from "@/components/calendar/MediaFloatingDetail";
import { ProfileKeywordCircles } from "@/components/profile/profile-keyword-circles";
import { ReflectionExitNav } from "@/components/reflection/reflection-exit-nav";
import { ReflectionJourney } from "@/components/reflection/reflection-journey";
import { useReflectionData } from "@/lib/reflection/use-reflection-data";
import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";
import type { MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";

function buildMonthlySummary(
  monthName: string,
  keywords: string[],
  fallback: string,
  total: number,
): string {
  if (total === 0) {
    return `Your ${monthName} page is still open — a quiet season waiting for the next chapter.`;
  }

  if (keywords.length >= 3) {
    return `Your month was shaped by ${keywords[0].toLowerCase()} stories, ${keywords[1].toLowerCase()} moments, and ${keywords[2].toLowerCase()}.`;
  }

  if (keywords.length === 2) {
    return `Your month was shaped by ${keywords[0].toLowerCase()} and ${keywords[1].toLowerCase()}.`;
  }

  return fallback.endsWith(".") ? fallback : `${fallback}.`;
}

/**
 * Journal expanded AI Reflection — time-based only.
 * Identity / taste DNA / long-term persona live on Profile.
 */
export function ReflectionPage() {
  const data = useReflectionData();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const keywords = useMemo(() => {
    const merged = [
      ...data.moodTags.map((tag) => ({ label: tag.label, weight: tag.weight })),
      ...data.tasteTags.map((tag) => ({ label: tag.label, weight: tag.weight })),
    ];
    const seen = new Set<string>();
    return merged
      .filter((tag) => {
        const key = tag.label.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 5);
  }, [data.moodTags, data.tasteTags]);

  const total =
    data.mediaStats.books + data.mediaStats.movies + data.mediaStats.music;
  const summary = buildMonthlySummary(
    data.month,
    keywords.map((tag) => tag.label),
    data.reflection.summary,
    total,
  );

  const recentInsights = data.reflection.insights
    .filter((insight) => !/lasting|personality|identity|dna/i.test(insight))
    .slice(0, 2);

  return (
    <>
      <div
        className="mx-auto max-w-[720px] px-5 pt-[calc(env(safe-area-inset-top)+20px)] md:px-8 md:py-10"
        style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
      >
        <div className="space-y-6 md:space-y-7">
          <header
            className={cn(
              "rounded-[28px] muse-dark-panel bg-white/[0.03]",
              "p-6 shadow-[0_16px_48px_rgba(0,0,0,0.22)] backdrop-blur-xl md:p-8",
            )}
          >
            <p className="font-label text-[10px] uppercase tracking-[0.18em] text-white/35">
              Journal AI Reflection
            </p>
            <h1 className="font-hero mt-2 text-[28px] font-medium tracking-tight text-white/92 md:text-[34px]">
              {data.month} Reflection
            </h1>
            <p className="font-label mt-2 text-[11px] text-white/34">
              What happened recently · {data.monthYear}
            </p>
            <p className="font-body mt-5 max-w-xl text-[15px] leading-relaxed text-white/62 md:text-base">
              {summary}
            </p>
          </header>

          {keywords.length > 0 ? (
            <section className="rounded-[24px] muse-dark-panel bg-white/[0.03] px-5 py-6 md:px-7">
              <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/32">
                Seasonal keywords
              </p>
              <ProfileKeywordCircles
                keywords={keywords}
                className="mt-4 justify-start"
                compact
              />
            </section>
          ) : null}

          <section className="rounded-[24px] muse-dark-panel bg-white/[0.03] px-5 py-6 md:px-7">
            <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/32">
              This month in numbers
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  [data.mediaStats.books, "Books"],
                  [data.mediaStats.movies, "Films"],
                  [data.mediaStats.music, "Music"],
                  [data.mediaStats.journalDays, "Journal days"],
                ] as const
              ).map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3"
                >
                  <dt className="font-label text-[10px] uppercase tracking-[0.12em] text-white/32">
                    {label}
                  </dt>
                  <dd className="mt-1 font-display text-xl font-bold text-white/85">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <ReflectionJourney
            journey={data.journey}
            onSelect={setSelectedItem}
          />

          {recentInsights.length > 0 ? (
            <section className="rounded-[24px] muse-dark-panel bg-white/[0.03] px-5 py-6 md:px-7">
              <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/32">
                Recent notes
              </p>
              <ul className="mt-4 space-y-3">
                {recentInsights.map((insight) => (
                  <li
                    key={insight}
                    className="font-body rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-white/62"
                  >
                    {insight}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <ReflectionExitNav className="pt-2" />
        </div>
      </div>

      <MediaFloatingDetail
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
