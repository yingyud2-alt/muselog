"use client";

const AI_NOTICES = [
  "AI noticed your recent mood feels reflective",
  "Your recent journey feels quietly nostalgic",
  "AI sensed a softer rhythm in your week",
] as const;

type BubbleAiMoodLabelProps = {
  className?: string;
};

export function BubbleAiMoodLabel({ className }: BubbleAiMoodLabelProps) {
  // Deterministic mock — no live AI system
  const dayIndex = new Date().getDate() % AI_NOTICES.length;
  const label = AI_NOTICES[dayIndex];

  return (
    <p
      className={
        className ??
        "font-display pointer-events-none absolute left-1/2 top-[18%] z-20 -translate-x-1/2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-white/42 backdrop-blur-md md:top-[16%]"
      }
    >
      {label}
    </p>
  );
}
