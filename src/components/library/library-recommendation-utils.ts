import type { Recommendation } from "@/lib/ai/recommendation-engine";
import type { ContentType } from "@/lib/content/types";

export function formatRecommendationWhy(recommendation: Recommendation): string {
  if (recommendation.becauseOf) {
    return `Recommended because you enjoyed ${recommendation.becauseOf}.`;
  }
  if (recommendation.reason.startsWith("Because ")) {
    return recommendation.reason.replace(/^Because /, "Recommended because ");
  }
  if (recommendation.tags.length > 0) {
    const themes = recommendation.tags.slice(0, 2).join(" and ");
    return `Recommended because you often return to ${themes}.`;
  }
  return "Recommended because this quietly matches your cultural archive.";
}

export function formatTasteAlignment(recommendation: Recommendation): string {
  if (recommendation.becauseOf) {
    return `Similar emotional temperature to ${recommendation.becauseOf}.`;
  }
  if (recommendation.tags.length > 0) {
    return `Aligned with your affinity for ${recommendation.tags
      .slice(0, 2)
      .join(" and ")}.`;
  }
  return "Aligned with the quieter works in your archive.";
}

type AiAnalysis = {
  narrative: string;
  emotional: string;
  atmosphere: string;
  related: string;
};

const TYPE_ANALYSIS: Record<ContentType, Omit<AiAnalysis, "related">> = {
  BOOK: {
    narrative: "Layered interior storytelling with patient pacing.",
    emotional: "Soft melancholy and human connection.",
    atmosphere: "Quiet rooms, night reading, reflective distance.",
  },
  MOVIE: {
    narrative: "Observational framing with restrained dramatic arcs.",
    emotional: "Tender distance and lingering afterimages.",
    atmosphere: "Muted light, city hush, cinematic stillness.",
  },
  MUSIC: {
    narrative: "Sparse motifs that leave space between phrases.",
    emotional: "Calm introspection with gentle warmth.",
    atmosphere: "Late-evening air, soft grain, unhurried tempo.",
  },
};

/** Presentation-only expansion for Library AI detail. */
export function buildRecommendationAnalysis(
  recommendation: Recommendation,
): AiAnalysis {
  const base = TYPE_ANALYSIS[recommendation.type];
  const related = recommendation.becauseOf
    ? `Related works in your orbit: ${recommendation.becauseOf}${
        recommendation.tags[0] ? `, and other ${recommendation.tags[0]} titles` : ""
      }.`
    : recommendation.tags.length > 0
      ? `Related works in your orbit: titles shaped by ${recommendation.tags
          .slice(0, 2)
          .join(" & ")}.`
      : "Related works in your orbit: the quieter titles already on your shelf.";

  return {
    ...base,
    related,
  };
}
