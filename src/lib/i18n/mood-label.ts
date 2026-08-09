import type { MessageKey, TranslateFn } from "@/lib/i18n";

const MOOD_KEYS = new Set([
  "reflective",
  "calm",
  "hopeful",
  "dreamy",
  "warm",
  "melancholic",
  "curious",
  "nostalgic",
  "romantic",
  "intense",
  "quiet",
]);

/** Translate mood tokens via shared i18n; unknown tokens pass through. */
export function translateMoodLabel(
  t: TranslateFn,
  mood: string | undefined | null,
): string {
  if (!mood) return "";
  const key = mood.trim().toLowerCase();
  if (!MOOD_KEYS.has(key)) return mood;
  return t(`mood.${key}` as MessageKey);
}
