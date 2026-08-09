/**
 * Provider-agnostic content localization boundary.
 * Homepage uses sync resolution from Work fields; cache is opt-in after mount.
 */

import { buildBubbleTeaser } from "@/lib/recommendation/bubble-teaser";
import {
  cleanDescription,
  DESCRIPTION_FALLBACK,
} from "@/lib/work/clean-description";
import type { Work } from "@/types/work";

export type LocalizedWorkPresentation = {
  title?: string;
  creator?: string;
  teaser?: string;
};

export type ContentTranslationProvider = {
  translateWorkPresentation(input: {
    workId: string;
    title: string;
    creator?: string;
    description?: string;
    type: Work["type"];
    targetLocale: "zh-CN";
  }): Promise<LocalizedWorkPresentation>;
};

export type BubbleLocalizedPresentation = {
  originalTitle: string;
  localizedTitle?: string;
  originalCreator: string;
  localizedCreator?: string;
  originalTeaser: string;
  localizedTeaser?: string;
  /** True when localized text exists and differs from the original. */
  hasLocalizedDiff: boolean;
};

export type CachedLocalizedContent = {
  title?: string;
  creator?: string;
  teaser?: string;
  translatedAt: string;
  source: "provider" | "cache" | "metadata" | "deterministic";
};

export const LOCALIZED_CONTENT_CACHE_KEY = "muselog-localized-content-zh-v1";
const CACHE_MAX = 200;

type CacheStore = Record<string, CachedLocalizedContent>;

function readCache(): CacheStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCALIZED_CONTENT_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CacheStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(store: CacheStore): void {
  if (typeof window === "undefined") return;
  try {
    const entries = Object.entries(store);
    const trimmed =
      entries.length <= CACHE_MAX
        ? store
        : Object.fromEntries(
            entries
              .sort(
                (a, b) =>
                  Date.parse(b[1].translatedAt) - Date.parse(a[1].translatedAt),
              )
              .slice(0, CACHE_MAX),
          );
    window.localStorage.setItem(
      LOCALIZED_CONTENT_CACHE_KEY,
      JSON.stringify(trimmed),
    );
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function getCachedLocalizedContent(
  workId: string,
): CachedLocalizedContent | null {
  if (!workId) return null;
  return readCache()[workId] ?? null;
}

export function setCachedLocalizedContent(
  workId: string,
  value: Omit<CachedLocalizedContent, "translatedAt"> & {
    translatedAt?: string;
  },
): void {
  if (!workId) return;
  const store = readCache();
  store[workId] = {
    title: value.title,
    creator: value.creator,
    teaser: value.teaser,
    source: value.source,
    translatedAt: value.translatedAt ?? new Date().toISOString(),
  };
  writeCache(store);
}

/** Han / CJK ideographs — enough to detect Chinese presentation fields. */
export function hasCjkScript(value: string | undefined | null): boolean {
  if (!value) return false;
  return /[\u3400-\u9fff\uf900-\ufaff]/.test(value);
}

function normalizeText(value: string | undefined | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function readMetadataString(
  metadata: Record<string, unknown> | undefined,
  keys: string[],
): string | undefined {
  if (!metadata) return undefined;
  for (const key of keys) {
    const raw = metadata[key];
    if (typeof raw === "string" && raw.trim()) {
      return raw.trim();
    }
  }
  return undefined;
}

function stripBubbleNoise(value: string): string {
  let text = value;
  text = text.replace(/\[([^\]]*?)\]\(\s*https?:\/\/[^)]+\)/gi, "$1");
  text = text.replace(/\[\*[^\]]*?\]/g, " ");
  text = text.replace(/\[([^\]]*?)\]\([^)]*\)/g, "$1");
  text = text.replace(/\(\s*https?:\/\/[^)]+\)/gi, " ");
  text = text.replace(/https?:\/\/\S+/gi, " ");
  text = text.replace(/\bwww\.\S+/gi, " ");
  text = text.replace(/\[[^\]]*source[^\]]*\]/gi, " ");
  text = text.replace(/\bRead more\b\.?/gi, " ");
  text = text.replace(/\bPDF\b/gi, " ");
  text = text.replace(/^["'“”‘’]+|["'“”‘’]+$/g, "");
  return text.replace(/\s+/g, " ").trim();
}

function textsDiffer(a: string | undefined, b: string): boolean {
  if (!a) return false;
  return normalizeText(a) !== normalizeText(b);
}

/** Concise Chinese teaser by character count (not Latin word boundaries). */
export function buildChineseBubbleTeaser(
  description: string | undefined,
  maxChars: number,
): string | undefined {
  const cleaned = cleanDescription(description ?? "");
  if (!cleaned || cleaned === DESCRIPTION_FALLBACK) return undefined;
  if (!hasCjkScript(cleaned)) return undefined;

  const text = stripBubbleNoise(cleaned);
  if (!text) return undefined;

  const sentenceMatch = text.match(/^(.+?[。！？!?])/);
  let candidate = sentenceMatch?.[1]?.trim() ?? text;
  candidate = candidate.replace(/[。！？!?]+$/u, "").trim();

  if (candidate.length <= maxChars) return candidate || undefined;

  const slice = candidate.slice(0, maxChars);
  const punct = Math.max(
    slice.lastIndexOf("，"),
    slice.lastIndexOf("、"),
    slice.lastIndexOf("；"),
    slice.lastIndexOf(","),
  );
  if (punct > maxChars * 0.45) {
    return slice.slice(0, punct).trim() || undefined;
  }
  return slice.trim() || undefined;
}

function pickLocalizedField(
  original: string,
  candidates: Array<string | undefined>,
): string | undefined {
  if (hasCjkScript(original)) return original;
  for (const candidate of candidates) {
    if (candidate && hasCjkScript(candidate)) return candidate;
  }
  return undefined;
}

/**
 * Sync presentation resolver for homepage Bubbles.
 * Uses Work fields + metadata only (no localStorage) so SSR/client match.
 * Priority: provider Chinese → metadata → original fallback.
 */
export function resolveBubblePresentation(
  work: Pick<
    Work,
    "id" | "title" | "creator" | "description" | "type" | "metadata"
  >,
  options?: { featured?: boolean },
): BubbleLocalizedPresentation {
  const originalTitle = normalizeText(work.title);
  const originalCreator = normalizeText(work.creator);
  const originalTeaser = buildBubbleTeaser(work as Work);
  const teaserMax = options?.featured ? 48 : 30;

  const metaTitle = readMetadataString(work.metadata, [
    "localizedTitle",
    "zhTitle",
    "chineseTitle",
    "titleZh",
    "title_zh",
  ]);
  const metaCreator = readMetadataString(work.metadata, [
    "localizedCreator",
    "zhCreator",
    "chineseCreator",
    "creatorZh",
    "creator_zh",
    "authorZh",
  ]);
  const metaTeaser = readMetadataString(work.metadata, [
    "localizedTeaser",
    "zhTeaser",
    "chineseDescription",
    "descriptionZh",
    "description_zh",
  ]);

  const localizedTitle = pickLocalizedField(originalTitle, [metaTitle]);
  const localizedCreator = pickLocalizedField(originalCreator, [metaCreator]);

  let localizedTeaser: string | undefined;
  if (hasCjkScript(originalTeaser)) {
    localizedTeaser = stripBubbleNoise(originalTeaser).slice(0, teaserMax);
  } else {
    localizedTeaser =
      buildChineseBubbleTeaser(work.description, teaserMax) ??
      (metaTeaser && hasCjkScript(metaTeaser)
        ? (buildChineseBubbleTeaser(metaTeaser, teaserMax) ??
          stripBubbleNoise(metaTeaser).slice(0, teaserMax))
        : undefined);
  }

  const hasLocalizedDiff =
    textsDiffer(localizedTitle, originalTitle) ||
    textsDiffer(localizedCreator, originalCreator) ||
    textsDiffer(localizedTeaser, originalTeaser);

  return {
    originalTitle,
    localizedTitle,
    originalCreator,
    localizedCreator,
    originalTeaser,
    localizedTeaser,
    hasLocalizedDiff,
  };
}

/** Merge post-mount cache entries into a presentation (client only). */
export function mergeCachedPresentation(
  base: BubbleLocalizedPresentation,
  workId: string | undefined,
): BubbleLocalizedPresentation {
  if (!workId) return base;
  const cached = getCachedLocalizedContent(workId);
  if (!cached) return base;

  const localizedTitle = pickLocalizedField(base.originalTitle, [
    base.localizedTitle,
    cached.title,
  ]);
  const localizedCreator = pickLocalizedField(base.originalCreator, [
    base.localizedCreator,
    cached.creator,
  ]);
  const localizedTeaser =
    base.localizedTeaser ??
    (cached.teaser && hasCjkScript(cached.teaser)
      ? stripBubbleNoise(cached.teaser).slice(0, 48)
      : undefined);

  const hasLocalizedDiff =
    textsDiffer(localizedTitle, base.originalTitle) ||
    textsDiffer(localizedCreator, base.originalCreator) ||
    textsDiffer(localizedTeaser, base.originalTeaser);

  return {
    ...base,
    localizedTitle,
    localizedCreator,
    localizedTeaser,
    hasLocalizedDiff,
  };
}

/** Persist presentation fields discovered from provider/metadata. */
export function persistPresentationCache(
  workId: string,
  presentation: BubbleLocalizedPresentation,
): void {
  if (!workId || !presentation.hasLocalizedDiff) return;
  setCachedLocalizedContent(workId, {
    title: presentation.localizedTitle,
    creator: presentation.localizedCreator,
    teaser: presentation.localizedTeaser,
    source: "metadata",
  });
}

/**
 * No-op async provider — ready for a future server-side LLM adapter.
 * Homepage never awaits this for first paint.
 */
export const noopContentTranslationProvider: ContentTranslationProvider = {
  async translateWorkPresentation() {
    return {};
  },
};
