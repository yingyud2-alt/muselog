"use client";

import { useMemo } from "react";

import { ImportantMemoryCard } from "@/components/journal/important-memory-card";
import { JournalAiReflectionCard } from "@/components/journal/journal-ai-reflection-card";
import { ReflectionEntryLink } from "@/components/reflection/reflection-entry-link";
import {
  filterMediaForMonth,
} from "@/lib/journal/journey-analytics";
import {
  computeMonthSummary,
  formatMonthYear,
  getMonthReflection,
} from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

type JourneyOverviewProps = {
  items: MediaItem[];
  year: number;
  month: number;
  onSelectItem?: (item: MediaItem, trigger: HTMLElement) => void;
  className?: string;
};

function pickImportantMemories(monthItems: MediaItem[], limit = 3): MediaItem[] {
  return [...monthItems]
    .sort((left, right) => {
      const leftScore =
        (left.rating ?? 0) * 10 +
        (left.quote ? 3 : 0) +
        (left.note ? 2 : 0) +
        (left.moment ? 1 : 0);
      const rightScore =
        (right.rating ?? 0) * 10 +
        (right.quote ? 3 : 0) +
        (right.note ? 2 : 0) +
        (right.moment ? 1 : 0);

      if (rightScore !== leftScore) return rightScore - leftScore;
      return (left.date ?? "").localeCompare(right.date ?? "");
    })
    .slice(0, limit);
}

function buildAiReflectionLine(
  monthName: string,
  tagline: string,
  total: number,
): string {
  if (total === 0) {
    return `Your ${monthName} page is still open — a quiet archive waiting for the next chapter.`;
  }

  const softened = tagline
    .replace(/^A month of /i, "")
    .replace(/^A /i, "")
    .toLowerCase();

  return `Your ${monthName} journey was filled with ${softened}.`;
}

export function JourneyOverview({
  items,
  year,
  month,
  onSelectItem,
  className,
}: JourneyOverviewProps) {
  const monthItems = useMemo(
    () => filterMediaForMonth(items, year, month),
    [items, month, year],
  );

  const summary = useMemo(() => computeMonthSummary(monthItems), [monthItems]);
  const { tagline, mostMemorable } = useMemo(
    () => getMonthReflection(monthItems),
    [monthItems],
  );
  const important = useMemo(
    () => pickImportantMemories(monthItems),
    [monthItems],
  );

  const monthLabel = formatMonthYear(year, month);
  const monthName = monthLabel.split(" ")[0] ?? "this";
  const aiLine = buildAiReflectionLine(monthName, tagline, summary.total);

  return (
    <div className={cn("space-y-6", className)}>
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03]",
        "p-6 shadow-[0_14px_40px_rgba(0,0,0,0.2)] backdrop-blur-xl md:p-8",
      )}
      aria-label="Monthly journey reflection"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--journal-accent, rgba(143,163,150,0.55)), transparent)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-6 left-0 w-[2px] rounded-full"
        style={{
          background:
            "linear-gradient(180deg, var(--journal-accent, rgba(143,163,150,0.55)), transparent)",
        }}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          <p className="font-label text-[10px] uppercase tracking-[0.18em] text-white/35">
            Journey Summary
          </p>
          <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-white/90">
            {monthLabel}
          </h2>
        </div>
        <ReflectionEntryLink className="shrink-0" />
      </div>

      <p className="font-display mt-4 max-w-2xl text-lg leading-relaxed text-white/68 md:text-xl">
        {aiLine}
      </p>

      <div className="mt-7 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-white/[0.06] pt-6">
        <p className="font-display text-sm text-white/55">
          <span className="font-label mr-1.5 text-lg font-bold tabular-nums text-white/82">
            {summary.total}
          </span>
          {summary.total === 1 ? "work" : "works"} this month
        </p>
        {summary.books > 0 ? (
          <p className="font-display text-sm text-white/45">
            <span className="font-label mr-1 font-bold tabular-nums text-white/70">
              {summary.books}
            </span>
            {summary.books === 1 ? "Book" : "Books"}
          </p>
        ) : null}
        {summary.movies > 0 ? (
          <p className="font-display text-sm text-white/45">
            <span className="font-label mr-1 font-bold tabular-nums text-white/70">
              {summary.movies}
            </span>
            {summary.movies === 1 ? "Movie" : "Movies"}
          </p>
        ) : null}
        {summary.albums > 0 ? (
          <p className="font-display text-sm text-white/45">
            <span className="font-label mr-1 font-bold tabular-nums text-white/70">
              {summary.albums}
            </span>
            {summary.albums === 1 ? "Album" : "Albums"}
          </p>
        ) : null}
      </div>

      {important.length > 0 || mostMemorable ? (
        <div className="mt-7 border-t border-white/[0.06] pt-6">
          <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/35">
            Important memories
          </p>
          <ul className="mt-4 space-y-3">
            {(important.length > 0 ? important : mostMemorable ? [mostMemorable] : []).map(
              (item) => (
                <li key={item.id} className="min-w-0">
                  <ImportantMemoryCard
                    item={item}
                    onSelect={onSelectItem ?? (() => undefined)}
                  />
                </li>
              ),
            )}
          </ul>
        </div>
      ) : null}
    </section>

    <JournalAiReflectionCard year={year} month={month} />
    </div>
  );
}
