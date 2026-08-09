"use client";

import { useLanguage } from "@/components/i18n/language-provider";
import { translateMoodLabel } from "@/lib/i18n/mood-label";
import type { RecommendationMood } from "@/lib/recommendation/mood-taxonomy";

type BubbleAiMoodLabelProps = {
  className?: string;
  mood?: RecommendationMood | string;
  onReshuffle?: () => void;
};

/**
 * Mood recommendation label for the homepage bubble field.
 * Metadata-based recommender — not an external LLM.
 */
export function BubbleAiMoodLabel({
  className,
  mood = "reflective",
  onReshuffle,
}: BubbleAiMoodLabelProps) {
  const { t } = useLanguage();
  const label = `${t("page.moodRecommendation")} · ${translateMoodLabel(t, mood)}`;

  if (onReshuffle) {
    return (
      <button
        type="button"
        onClick={onReshuffle}
        className={
          className ??
          "font-display absolute left-1/2 top-[18%] z-20 -translate-x-1/2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-white/42 backdrop-blur-md transition-colors hover:border-white/[0.14] hover:text-white/58 md:top-[16%]"
        }
        aria-label={t("page.moodRecommendation")}
      >
        {label}
      </button>
    );
  }

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
