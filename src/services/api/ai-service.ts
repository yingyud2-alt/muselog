import type { Work, WorkAiInsights } from "@/types/work";

export type AiRecommendationInput = {
  works: Work[];
  limit?: number;
};

export type AiRecommendationResult = {
  workIds: string[];
  reasons: Record<string, string>;
};

export type AiReflectionInput = {
  work: Work;
  relatedNotes?: string[];
};

/**
 * Muse AI service contract (future model endpoint).
 * Placeholder only — do not call external APIs yet.
 */
export type AiService = {
  recommend(input: AiRecommendationInput): Promise<AiRecommendationResult>;
  reflect(input: AiReflectionInput): Promise<WorkAiInsights>;
  summarizeTaste(works: Work[]): Promise<string>;
};

export const aiService: AiService = {
  async recommend(): Promise<AiRecommendationResult> {
    return { workIds: [], reasons: {} };
  },

  async reflect(): Promise<WorkAiInsights> {
    return {};
  },

  async summarizeTaste(): Promise<string> {
    return "";
  },
};
