"use client";

import { useCallback, useSyncExternalStore } from "react";

import type {
  MoodAtmosphere,
  MoodEmotion,
  MoodInterest,
  MoodPreferenceProfile,
  RecommendationContext,
} from "@/types/preferences";

const STORAGE_KEY = "muselog-mood-preferences-v1";
const EVENT = "muselog-mood-preferences-updated";

export const MOOD_EMOTIONS: { id: MoodEmotion; label: string }[] = [
  { id: "calm", label: "calm" },
  { id: "nostalgic", label: "nostalgic" },
  { id: "curious", label: "curious" },
  { id: "melancholic", label: "melancholic" },
];

export const MOOD_INTERESTS: { id: MoodInterest; label: string }[] = [
  { id: "memory", label: "memory" },
  { id: "nature", label: "nature" },
  { id: "human", label: "human stories" },
  { id: "identity", label: "identity" },
];

export const MOOD_ATMOSPHERES: { id: MoodAtmosphere; label: string }[] = [
  { id: "rainy", label: "rainy" },
  { id: "warm", label: "warm" },
  { id: "quiet", label: "quiet" },
  { id: "urban", label: "urban" },
];

const DEFAULT_PROFILE: MoodPreferenceProfile = {
  emotions: ["calm", "nostalgic"],
  interests: ["memory"],
  atmospheres: ["quiet"],
  updatedAt: "2026-07-01T00:00:00.000Z",
};

let cached: MoodPreferenceProfile = DEFAULT_PROFILE;
let initialized = false;

function sanitizeList<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T[] {
  if (!Array.isArray(value)) return [];
  const allowedSet = new Set(allowed);
  return value.filter((item): item is T => typeof item === "string" && allowedSet.has(item as T));
}

function sanitizeProfile(
  value: Partial<MoodPreferenceProfile> | null | undefined,
): MoodPreferenceProfile {
  const emotions = sanitizeList(
    value?.emotions,
    MOOD_EMOTIONS.map((item) => item.id),
  );
  const interests = sanitizeList(
    value?.interests,
    MOOD_INTERESTS.map((item) => item.id),
  );
  const atmospheres = sanitizeList(
    value?.atmospheres,
    MOOD_ATMOSPHERES.map((item) => item.id),
  );

  return {
    emotions: emotions.length > 0 ? emotions : DEFAULT_PROFILE.emotions,
    interests: interests.length > 0 ? interests : DEFAULT_PROFILE.interests,
    atmospheres:
      atmospheres.length > 0 ? atmospheres : DEFAULT_PROFILE.atmospheres,
    updatedAt:
      typeof value?.updatedAt === "string"
        ? value.updatedAt
        : DEFAULT_PROFILE.updatedAt,
  };
}

function read(): MoodPreferenceProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return sanitizeProfile(JSON.parse(raw) as Partial<MoodPreferenceProfile>);
  } catch {
    return DEFAULT_PROFILE;
  }
}

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  cached = read();
  initialized = true;
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  ensureInit();
  const handler = () => {
    cached = read();
    initialized = true;
    cb();
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

function write(next: MoodPreferenceProfile) {
  cached = next;
  initialized = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getMoodPreferenceProfile(): MoodPreferenceProfile {
  ensureInit();
  return cached;
}

export function setMoodPreferenceProfile(
  next: Omit<MoodPreferenceProfile, "updatedAt"> & { updatedAt?: string },
) {
  ensureInit();
  write(
    sanitizeProfile({
      ...next,
      updatedAt: next.updatedAt ?? new Date().toISOString(),
    }),
  );
}

export function buildRecommendationContext(
  profile: MoodPreferenceProfile = getMoodPreferenceProfile(),
): RecommendationContext {
  const moodKeywords = [
    ...profile.emotions,
    ...profile.atmospheres,
  ];
  const preferenceTags = [
    ...profile.emotions,
    ...profile.interests,
    ...profile.atmospheres,
  ];

  return {
    moodKeywords,
    preferenceTags,
    profile,
  };
}

/** AI-flavored mood keywords for editorial display (MVP mock). */
export function deriveAiMoodKeywords(
  profile: MoodPreferenceProfile,
  fallback: string[] = [],
): string[] {
  const primary = [
    ...profile.emotions,
    ...profile.atmospheres,
    ...profile.interests.slice(0, 1),
  ];

  const unique = Array.from(new Set(primary.map((item) => item.toLowerCase())));
  if (unique.length >= 2) return unique.slice(0, 4);

  const merged = Array.from(
    new Set([...unique, ...fallback.map((item) => item.toLowerCase())]),
  );
  return merged.slice(0, 4);
}

function toggleInList<T extends string>(list: T[], id: T, max = 3): T[] {
  if (list.includes(id)) {
    return list.filter((item) => item !== id);
  }
  if (list.length >= max) {
    return [...list.slice(1), id];
  }
  return [...list, id];
}

export function useMoodPreferences() {
  const profile = useSyncExternalStore(
    subscribe,
    () => {
      ensureInit();
      return cached;
    },
    () => DEFAULT_PROFILE,
  );

  const saveProfile = useCallback(
    (next: Omit<MoodPreferenceProfile, "updatedAt">) => {
      setMoodPreferenceProfile(next);
    },
    [],
  );

  const toggleEmotion = useCallback((id: MoodEmotion) => {
    ensureInit();
    write({
      ...cached,
      emotions: toggleInList(cached.emotions, id),
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const toggleInterest = useCallback((id: MoodInterest) => {
    ensureInit();
    write({
      ...cached,
      interests: toggleInList(cached.interests, id),
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const toggleAtmosphere = useCallback((id: MoodAtmosphere) => {
    ensureInit();
    write({
      ...cached,
      atmospheres: toggleInList(cached.atmospheres, id),
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const recommendationContext = buildRecommendationContext(profile);
  const moodKeywords = deriveAiMoodKeywords(profile);

  return {
    profile,
    moodKeywords,
    recommendationContext,
    saveProfile,
    toggleEmotion,
    toggleInterest,
    toggleAtmosphere,
  };
}
