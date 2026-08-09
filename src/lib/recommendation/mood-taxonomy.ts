/**
 * Shared mood taxonomy for homepage Mood Bubbles.
 * Maps moods → weighted metadata signals (genres / tags / subjects / keywords).
 */

export const RECOMMENDATION_MOODS = [
  "calm",
  "melancholic",
  "hopeful",
  "dreamy",
  "reflective",
  "warm",
  "nostalgic",
  "intense",
  "romantic",
  "curious",
] as const;

export type RecommendationMood = (typeof RECOMMENDATION_MOODS)[number];

export type MoodSignalWeights = {
  genres: string[];
  tags: string[];
  subjects: string[];
  keywords: string[];
  /** Soft preference boost for media types (book / movie / music). */
  mediaPreference?: Partial<Record<"book" | "movie" | "music", number>>;
};

export const MOOD_TAXONOMY: Record<RecommendationMood, MoodSignalWeights> = {
  calm: {
    genres: ["jazz", "ambient", "slice of life", "documentary", "literary fiction"],
    tags: ["quiet", "gentle", "contemplative", "soft", "still"],
    subjects: ["nature", "mindfulness", "everyday life"],
    keywords: ["quiet", "gentle", "calm", "still", "slow", "peaceful", "serene"],
    mediaPreference: { music: 1.1, book: 1.05, movie: 1 },
  },
  melancholic: {
    genres: ["drama", "indie", "literary fiction", "alternative"],
    tags: ["melancholy", "lonely", "reflective", "bittersweet", "memory"],
    subjects: ["loss", "loneliness", "memory", "grief"],
    keywords: ["loss", "lonely", "memory", "rain", "melancholy", "sorrow", "yearning"],
    mediaPreference: { book: 1.1, music: 1.05, movie: 1 },
  },
  hopeful: {
    genres: ["adventure", "coming of age", "friendship", "animation"],
    tags: ["hopeful", "uplifting", "healing", "warm", "tender"],
    subjects: ["friendship", "healing", "growth"],
    keywords: ["hope", "friendship", "heal", "light", "warm", "together", "begin"],
    mediaPreference: { movie: 1.1, book: 1.05, music: 1 },
  },
  dreamy: {
    genres: ["fantasy", "magical realism", "science fiction", "ambient", "surreal"],
    tags: ["dreamlike", "surreal", "imagination", "ethereal"],
    subjects: ["dreams", "imagination", "magic"],
    keywords: ["dream", "surreal", "imagine", "fantasy", "wonder", "strange", "otherworld"],
    mediaPreference: { movie: 1.1, music: 1.05, book: 1 },
  },
  reflective: {
    genres: ["literary fiction", "memoir", "drama", "indie", "philosophy"],
    tags: ["reflective", "quiet", "thoughtful", "introspective"],
    subjects: ["philosophy", "identity", "memory"],
    keywords: ["reflect", "think", "memory", "quiet", "inner", "self", "ponder"],
    mediaPreference: { book: 1.15, movie: 1, music: 1 },
  },
  warm: {
    genres: ["romance", "comedy", "slice of life", "folk", "soul"],
    tags: ["warm", "tender", "cozy", "intimate", "human"],
    subjects: ["family", "friendship", "love"],
    keywords: ["warm", "tender", "home", "love", "kind", "soft", "comfort"],
    mediaPreference: { movie: 1.1, music: 1.05, book: 1 },
  },
  nostalgic: {
    genres: ["memoir", "coming of age", "indie", "folk", "historical"],
    tags: ["nostalgic", "memory", "bittersweet", "youth"],
    subjects: ["memory", "childhood", "past"],
    keywords: ["memory", "nostalg", "youth", "past", "remember", "return", "childhood"],
    mediaPreference: { book: 1.1, music: 1.1, movie: 1 },
  },
  intense: {
    genres: ["thriller", "crime", "science fiction", "electronic", "mystery"],
    tags: ["intense", "dark", "suspense", "powerful"],
    subjects: ["conflict", "survival", "mystery"],
    keywords: ["dark", "intense", "tension", "danger", "power", "shock", "brutal"],
    mediaPreference: { movie: 1.15, music: 1.05, book: 1 },
  },
  romantic: {
    genres: ["romance", "drama", "r&b", "pop", "literary fiction"],
    tags: ["romantic", "longing", "intimate", "tender"],
    subjects: ["love", "relationships", "desire"],
    keywords: ["love", "romance", "heart", "desire", "kiss", "longing", "affair"],
    mediaPreference: { movie: 1.1, music: 1.1, book: 1.05 },
  },
  curious: {
    genres: ["science fiction", "mystery", "documentary", "experimental", "philosophy"],
    tags: ["curious", "mysterious", "exploratory", "strange"],
    subjects: ["science", "discovery", "ideas"],
    keywords: ["mystery", "discover", "curious", "strange", "question", "explore", "unknown"],
    mediaPreference: { book: 1.1, movie: 1.1, music: 1 },
  },
};

/** Normalize free-form / preference emotion → recommendation mood. */
export function resolveRecommendationMood(
  value: string | null | undefined,
): RecommendationMood {
  const key = (value ?? "").trim().toLowerCase();
  if ((RECOMMENDATION_MOODS as readonly string[]).includes(key)) {
    return key as RecommendationMood;
  }
  if (key === "quiet") return "calm";
  if (key === "sad" || key === "lonely") return "melancholic";
  if (key === "happy" || key === "uplifting") return "hopeful";
  if (key === "soft") return "warm";
  return "reflective";
}

export function isRecommendationMood(value: string): value is RecommendationMood {
  return (RECOMMENDATION_MOODS as readonly string[]).includes(value);
}
