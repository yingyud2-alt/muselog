/** Explicit cultural preference profile — API-ready for future Muse AI. */
export type MoodEmotion =
  | "calm"
  | "nostalgic"
  | "curious"
  | "melancholic";

export type MoodInterest =
  | "nature"
  | "human"
  | "identity"
  | "memory";

export type MoodAtmosphere =
  | "rainy"
  | "warm"
  | "quiet"
  | "urban";

export type MoodPreferenceProfile = {
  emotions: MoodEmotion[];
  interests: MoodInterest[];
  atmospheres: MoodAtmosphere[];
  /** ISO timestamp — ready for sync APIs */
  updatedAt: string;
};

export type RecommendationContext = {
  /** Flattened keywords for engines */
  moodKeywords: string[];
  /** Explicit taste tags for Cultural DNA / ranking */
  preferenceTags: string[];
  profile: MoodPreferenceProfile;
};

/**
 * Future DB: user_settings.journalTheme
 * Persisted locally via journal-theme-store.
 */
export type JournalThemeId =
  | "morandi"
  | "macaron"
  | "dopamine"
  | "midnight"
  | "forest";

export type UserSettings = {
  journalTheme: JournalThemeId;
};
