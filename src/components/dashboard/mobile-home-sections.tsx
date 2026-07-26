"use client";

import {
  BookOpen,
  Film,
  Headphones,
} from "lucide-react";

import {
  formatDisplayWeekday,
  getDisplayGreeting,
} from "@/lib/display-date";

import {
  aiPicks,
  continueExploring,
  readingStats,
} from "./mock-data";
import { StatsGrid } from "./stats-grid";

export function MobileCompactHeader() {
  return (
    <header
      className="shrink-0 px-6 pb-1 pt-[calc(env(safe-area-inset-top)+12px)] md:hidden"
      style={{ maxHeight: 110 }}
    >
      <p className="font-label text-[11px] text-white/36">{formatDisplayWeekday()}</p>
      <h1 className="font-hero mt-1.5 pr-[76px] text-[24px] font-medium leading-tight tracking-tight text-white/92">
        {getDisplayGreeting()} 👋
      </h1>
      <p className="font-display mt-1 pr-[76px] text-[13px] text-white/44">
        What will you log today?
      </p>
    </header>
  );
}

export function MobileBubblePrompt() {
  return (
    <section
      className="mb-9 flex min-h-[80px] items-center justify-center px-6 pb-1 pt-1 md:hidden"
      aria-label="Explore prompt"
    >
      <div className="max-w-[300px] text-center">
        <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/38">
          Explore by feeling
        </p>
        <p
          className="font-quote mt-2 text-[16px] italic leading-snug text-white/72"
          style={{ fontWeight: 500 }}
        >
          &ldquo;Begin with a feeling, not a title.&rdquo;
        </p>
        <p className="font-display mt-2 text-[11px] text-white/36">
          Tap a bubble to explore · Hold and move to focus
        </p>
      </div>
    </section>
  );
}

function MobileInfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
      <h2 className="font-display text-sm font-bold text-white/82">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function MobileInfoSection() {
  const inspiration = aiPicks[0];
  const recentNote = continueExploring[0];

  return (
    <div className="space-y-4 px-6 pb-[calc(env(safe-area-inset-bottom)+108px)] pt-4 md:hidden">
      <MobileInfoCard title="Today's inspiration">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/8 text-white/70">
            {inspiration.type === "book" && <BookOpen size={16} />}
            {inspiration.type === "movie" && <Film size={16} />}
            {inspiration.type === "music" && <Headphones size={16} />}
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-normal text-white/88">{inspiration.title}</p>
            <p className="font-body mt-0.5 text-xs text-white/42">{inspiration.creator}</p>
            <p className="font-display mt-2 text-xs leading-relaxed text-white/54">
              {inspiration.reason}
            </p>
          </div>
        </div>
      </MobileInfoCard>

      <MobileInfoCard title="Recent notes">
        <div className="flex items-start gap-3">
          <div
            className={`h-12 w-9 shrink-0 rounded-lg bg-gradient-to-br ${recentNote.coverClassName}`}
          />
          <div className="min-w-0">
            <p className="font-display text-sm font-normal text-white/88">{recentNote.title}</p>
            <p className="font-body mt-0.5 text-xs text-white/42">{recentNote.creator}</p>
            <p className="font-label mt-2 text-xs text-white/48">
              {recentNote.categoryLabel} · {recentNote.lastOpened}
            </p>
          </div>
        </div>
      </MobileInfoCard>

      <MobileInfoCard title="Reading stats">
        <StatsGrid items={readingStats} />
      </MobileInfoCard>
    </div>
  );
}
