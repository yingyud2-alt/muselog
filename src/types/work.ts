/**
 * Canonical MuseLog Work entity — API-ready unified schema.
 * All surfaces (Home, Library, Journal, Profile, Detail) should
 * resolve through this model rather than duplicating shapes.
 */
export type WorkType = "book" | "movie" | "music";

/** User relationship with a work — single vocabulary across the app. */
export type WorkUserStatus = "want" | "reading" | "finished" | "dropped";

/** @deprecated Use WorkUserStatus */
export type WorkUserState = WorkUserStatus;

export type WorkTimeline = {
  startDate?: string;
  endDate?: string;
  /** Duration in days when both ends are known. */
  duration?: number;
};

export type WorkAiInsights = {
  summary?: string;
  themes?: string[];
  recommendations?: string[];
};

export type Work = {
  id: string;
  type: WorkType;
  title: string;
  creator: string;
  /** Image URL or legacy gradient class string until assets are remote. */
  coverUrl: string;
  description: string;
  releaseDate?: string;
  genres: string[];
  /**
   * Relationship status — want / reading / finished / dropped.
   * Catalog/import Works may use a default until the user interacts.
   */
  userStatus: WorkUserStatus;
  /**
   * @deprecated Alias of userStatus for transitional call sites.
   * Prefer userStatus.
   */
  userState: WorkUserStatus;
  timeline: WorkTimeline;
  userNotes: string;
  moodTags: string[];
  /** Optional 1–5 rating when finished (or revisited). */
  rating?: number;
  /** Optional short review / reflection. */
  review?: string;
  /** Optional reason when status is dropped. */
  droppedReason?: string;
  aiInsights?: WorkAiInsights;
  /** Provider key, e.g. "open_library", "tmdb", "spotify". */
  source?: string;
  /** Stable id in the external provider. */
  externalId?: string;
  /** Opaque provider payload / extras for future API use. */
  metadata?: Record<string, unknown>;
};
