"use client";

import { useMemo, useState } from "react";

import { HabitDetailSheet } from "@/components/habit/HabitDetailSheet";
import { MonthlyRhythmPanel } from "@/components/journal/monthly-rhythm-panel";
import { buildActivityDotMatrix } from "@/lib/habit/habit-matrix-utils";
import { useHabitLogs } from "@/lib/habit/habit-store";
import {
  museActivityToRhythmType,
  type RhythmPanelType,
} from "@/lib/journal/rhythm-panel-utils";
import type { MuseActivity } from "@/types/habit";
import { cn } from "@/lib/utils";

type HabitStatCardsProps = {
  year: number;
  month: number;
  className?: string;
};

type HabitCardConfig = {
  activity: MuseActivity;
  label: string;
  emoji: string;
  filledClass: string;
  emptyClass: string;
};

const HABIT_CARDS: HabitCardConfig[] = [
  {
    activity: "read",
    label: "Reading",
    emoji: "📖",
    filledClass: "var(--journal-activity-1, rgba(45,212,191,0.5))",
    emptyClass: "bg-white/[0.07]",
  },
  {
    activity: "watch",
    label: "Watching",
    emoji: "🎬",
    filledClass: "var(--journal-activity-2, rgba(251,191,36,0.45))",
    emptyClass: "bg-white/[0.07]",
  },
  {
    activity: "listen",
    label: "Listening",
    emoji: "🎵",
    filledClass: "var(--journal-activity-3, rgba(132,204,22,0.4))",
    emptyClass: "bg-white/[0.07]",
  },
];

function DotMatrix({
  dots,
  filledClass,
  emptyClass,
}: {
  dots: boolean[];
  filledClass: string;
  emptyClass: string;
}) {
  return (
    <div className="grid grid-cols-10 gap-[3px]" aria-hidden="true">
      {dots.map((filled, index) => (
        <span
          key={index}
          className={cn(
            "size-[5px] rounded-full md:size-1.5",
            !filled && emptyClass,
          )}
          style={
            filled
              ? { backgroundColor: filledClass }
              : undefined
          }
        />
      ))}
    </div>
  );
}

function HabitStatCard({
  config,
  dots,
  onClick,
}: {
  config: HabitCardConfig;
  dots: boolean[];
  onClick: () => void;
}) {
  const completed = dots.filter(Boolean).length;
  const total = dots.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col rounded-[16px] border border-white/[0.06] bg-white/[0.025] p-2.5 text-left",
        "shadow-[0_2px_16px_rgba(0,0,0,0.1)] backdrop-blur-md",
        "transition-colors hover:border-white/10 hover:bg-white/[0.04]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/12",
        "md:rounded-[18px] md:p-3",
      )}
    >
      <div className="flex items-center gap-1">
        <span className="text-xs md:text-sm" aria-hidden="true">
          {config.emoji}
        </span>
        <span className="truncate text-[10px] font-medium text-white/55 md:text-[11px]">
          {config.label}
        </span>
      </div>

      <div className="mt-2 md:mt-2.5">
        <DotMatrix
          dots={dots}
          filledClass={config.filledClass}
          emptyClass={config.emptyClass}
        />
      </div>

      <p className="mt-1.5 text-[9px] tabular-nums text-white/35 md:text-[10px]">
        {completed} / {total} days
      </p>
    </button>
  );
}

export function HabitStatCards({ year, month, className }: HabitStatCardsProps) {
  const { logs } = useHabitLogs();
  const [selectedActivity, setSelectedActivity] = useState<MuseActivity | null>(
    null,
  );

  const matrices = useMemo(
    () =>
      HABIT_CARDS.map((card) => ({
        ...card,
        dots: buildActivityDotMatrix(logs, year, month, card.activity),
      })),
    [logs, year, month],
  );

  const rhythmType: RhythmPanelType | null = selectedActivity
    ? museActivityToRhythmType(selectedActivity)
    : null;

  return (
    <>
      <section className={className}>
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
          Muse rhythm
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2 md:gap-3">
          {matrices.map((card) => (
            <HabitStatCard
              key={card.activity}
              config={card}
              dots={card.dots}
              onClick={() => setSelectedActivity(card.activity)}
            />
          ))}
        </div>
      </section>

      {/* Mobile: keep existing bottom sheet */}
      <div className="md:hidden">
        <HabitDetailSheet
          activity={selectedActivity}
          year={year}
          month={month}
          onClose={() => setSelectedActivity(null)}
        />
      </div>

      {/* Desktop: immersive monthly floating panel */}
      <MonthlyRhythmPanel
        type={rhythmType}
        onClose={() => setSelectedActivity(null)}
      />
    </>
  );
}
