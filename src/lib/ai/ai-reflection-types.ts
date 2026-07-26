/**
 * Shared input shape for Muse AI Reflection.
 * Designed so a future API client can accept the same payload.
 */
export type AiReflectionUserMedia = {
  title: string;
  type: string;
  status?: string;
  /** Canonical Work status for preference modeling. */
  userStatus?: "want" | "reading" | "finished" | "dropped";
  rating?: number;
  review?: string;
  droppedReason?: string;
  /** Preference signals for future AI. */
  liked?: boolean;
  finished?: boolean;
  abandoned?: boolean;
  tags?: string[];
  shortReview?: string;
  notes?: string;
};

export type AiReflectionJournalEntry = {
  title: string;
  type: string;
  note?: string;
  quote?: string;
  tags?: string[];
  date?: string;
};

export type AiReflectionActivity = {
  label: string;
  date?: string;
};

export type AiReflectionInput = {
  userMedia: AiReflectionUserMedia[];
  journalEntries: AiReflectionJournalEntry[];
  recentActivities: AiReflectionActivity[];
};

export type AiReflectionResult = {
  text: string;
  themes: string[];
  /** Placeholder for future model / prompt metadata */
  source: "mock";
};
