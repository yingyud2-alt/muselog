/**
 * API-facing Work contract.
 * Keep in sync with the canonical domain model in `@/types/work`.
 */
export type {
  Work,
  WorkAiInsights,
  WorkEnrichment,
  WorkEnrichmentSimilarWork,
  WorkTimeline,
  WorkType,
  WorkUserState,
  WorkUserStatus,
} from "@/types/work";

/** Future list/query params for work endpoints. */
export type WorkListQuery = {
  type?: import("@/types/work").WorkType | "all";
  userStatus?: import("@/types/work").WorkUserStatus | "all";
  /** @deprecated Use userStatus */
  userState?: import("@/types/work").WorkUserStatus | "all";
  q?: string;
  limit?: number;
  cursor?: string;
};

export type WorkListResult = {
  items: import("@/types/work").Work[];
  nextCursor?: string;
};
