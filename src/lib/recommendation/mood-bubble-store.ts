"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  resolveRecommendationMood,
  type RecommendationMood,
} from "@/lib/recommendation/mood-taxonomy";

const STORAGE_KEY = "muselog-mood-bubble-rec-v1";
const EVENT = "muselog-mood-bubble-rec-updated";

export type MoodBubbleRecState = {
  mood: RecommendationMood;
  seed: number;
};

const DEFAULT_STATE: MoodBubbleRecState = {
  mood: "reflective",
  seed: 1,
};

let cached: MoodBubbleRecState = DEFAULT_STATE;
let initialized = false;

function sanitize(value: Partial<MoodBubbleRecState> | null | undefined): MoodBubbleRecState {
  const mood = resolveRecommendationMood(value?.mood);
  const seed =
    typeof value?.seed === "number" && Number.isFinite(value.seed)
      ? Math.floor(value.seed)
      : DEFAULT_STATE.seed;
  return { mood, seed };
}

function read(): MoodBubbleRecState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return sanitize(JSON.parse(raw) as Partial<MoodBubbleRecState>);
  } catch {
    return DEFAULT_STATE;
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

function write(next: MoodBubbleRecState) {
  cached = next;
  initialized = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getMoodBubbleRecState(): MoodBubbleRecState {
  ensureInit();
  return cached;
}

export function setMoodBubbleMood(mood: string) {
  ensureInit();
  const nextMood = resolveRecommendationMood(mood);
  // New mood → new seed so content reshuffles while remaining deterministic.
  write({
    mood: nextMood,
    seed: cached.mood === nextMood ? cached.seed : cached.seed + 1,
  });
}

export function reshuffleMoodBubbleSeed() {
  ensureInit();
  write({
    mood: cached.mood,
    seed: cached.seed + 1,
  });
}

export function useMoodBubbleRecState() {
  const state = useSyncExternalStore(
    subscribe,
    () => {
      ensureInit();
      return cached;
    },
    () => DEFAULT_STATE,
  );

  const setMood = useCallback((mood: string) => {
    setMoodBubbleMood(mood);
  }, []);

  const reshuffle = useCallback(() => {
    reshuffleMoodBubbleSeed();
  }, []);

  return { ...state, setMood, reshuffle };
}
