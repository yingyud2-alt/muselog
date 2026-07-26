"use client";

import { useMemo } from "react";
import Link from "next/link";

import { useReflectionData } from "@/lib/reflection/use-reflection-data";
import { cn } from "@/lib/utils";

const MONTH_STORAGE_KEY = "muselog-profile-month";

type JournalAiReflectionCardProps = {
  year: number;
  month: number;
  className?: string;
};

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
 * Journal monthly preview only — full reflection lives on Profile.
 */
export function JournalAiReflectionCard({
  year,
  month,
  className,
}: JournalAiReflectionCardProps) {
  const data = useReflectionData(year, month);

  const keywords = useMemo(() => {
    const merged = [
      ...data.moodTags.map((tag) => tag.label),
      ...data.tasteTags.map((tag) => tag.label),
    ];
    return [...new Set(merged)].slice(0, 3);
  }, [data.moodTags, data.tasteTags]);

  const importantWorks = useMemo(
    () => data.journey.slice(0, 3),
    [data.journey],
  );

  const total =
    data.mediaStats.books + data.mediaStats.movies + data.mediaStats.music;
  const summary = buildMonthlySummary(
    data.month,
    keywords,
    data.reflection.summary,
    total,
  );

  const openProfileMonth = () => {
    if (typeof window === "undefined") return;
    // Persist selected Journal month for Profile Monthly Reports restore.
    window.sessionStorage.setItem(MONTH_STORAGE_KEY, `${year}-${month}`);
  };

  return (
    <section
      id="journal-ai-reflection"
      className={cn(
        "scroll-mt-24 rounded-[24px] border border-white/[0.08] bg-white/[0.03]",
        "px-5 py-6 shadow-[0_14px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl md:px-7 md:py-7",
        className,
      )}
      aria-label="Journal monthly reflection preview"
    >
      <p className="font-label text-[10px] uppercase tracking-[0.18em] text-white/35">
        Monthly Report
      </p>
      <h2 className="font-hero mt-2 text-[22px] font-medium tracking-tight text-white/90 md:text-[26px]">
        {data.month} Reflection
      </h2>

      <p className="font-body mt-4 max-w-xl text-[15px] leading-relaxed text-white/60 md:text-base">
        {summary}
      </p>

      <div className="mt-6">
        <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/32">
          Basic statistics
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-white/48">
          <li>{data.mediaStats.books} books</li>
          <li>{data.mediaStats.movies} films</li>
          <li>{data.mediaStats.music} music</li>
          <li>{data.mediaStats.journalDays} journal days</li>
        </ul>
      </div>

      {importantWorks.length > 0 ? (
        <div className="mt-6">
          <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/32">
            Important works
          </p>
          <ul className="mt-3 space-y-2">
            {importantWorks.map((work) => (
              <li
                key={work.id}
                className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] pb-2 last:border-0 last:pb-0"
              >
                <span className="font-display text-[14px] text-white/82">
                  {work.title}
                </span>
                <span className="shrink-0 font-label text-[10px] uppercase tracking-[0.1em] text-white/30">
                  {work.typeLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-7 border-t border-white/[0.06] pt-5">
        <Link
          href="/profile#monthly-reports"
          onClick={openProfileMonth}
          className={cn(
            "inline-flex items-center rounded-xl border border-white/[0.1]",
            "bg-white/[0.045] px-3.5 py-2 font-display text-[12px] font-bold text-white/72",
            "shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md",
            "transition-colors hover:bg-white/[0.08] hover:text-white/92",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
          )}
        >
          View full reflection in Profile →
        </Link>
      </div>
    </section>
  );
}
