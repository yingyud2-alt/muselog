import { enUS } from "@/lib/i18n/en-US";
import {
  DEFAULT_LOCALE,
  LEGACY_LOCALE_STORAGE_KEY,
  LOCALE_STORAGE_KEY,
  LOCALES,
  type Locale,
  type MessageDictionary,
  type MessageKey,
  type NavSubtitleKey,
  type NavTitleKey,
  type TranslationParams,
} from "@/lib/i18n/types";
import { zhCN } from "@/lib/i18n/zh-CN";

export {
  DEFAULT_LOCALE,
  LEGACY_LOCALE_STORAGE_KEY,
  LOCALE_STORAGE_KEY,
  LOCALES,
  type Locale,
  type MessageDictionary,
  type MessageKey,
  type NavSubtitleKey,
  type NavTitleKey,
  type TranslationParams,
};

export const dictionaries: Record<Locale, MessageDictionary> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};

/** Metadata copy for future locale-aware routing (no /zh|/en routes yet). */
export const metadataByLocale: Record<
  Locale,
  { title: string; description: string }
> = {
  "zh-CN": {
    title: "忆屿 MuseLog",
    description: "一座由书籍、电影、音乐与感受构成的个人情感群岛。",
  },
  "en-US": {
    title: "MuseLog",
    description: "Your Emotional Archipelago — an emotional archive for books, films and music.",
  },
};

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(raw)) {
      return raw;
    }

    const legacy = window.localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY);
    if (isLocale(legacy)) {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, legacy);
      window.localStorage.removeItem(LEGACY_LOCALE_STORAGE_KEY);
      return legacy;
    }

    return null;
  } catch {
    return null;
  }
}

export function writeStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function resolveMessage(
  dictionary: MessageDictionary,
  key: MessageKey,
): string {
  const [group, leaf] = key.split(".") as [
    keyof MessageDictionary,
    string,
  ];
  const section = dictionary[group] as Record<string, string> | undefined;
  return section?.[leaf] ?? key;
}

export function translate(
  locale: Locale,
  key: MessageKey,
  params?: TranslationParams,
): string {
  const dictionary = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  let message = resolveMessage(dictionary, key);

  if (params) {
    for (const [name, value] of Object.entries(params)) {
      message = message.replaceAll(`{${name}}`, String(value));
    }
  }

  return message;
}

export type TranslateFn = (
  key: MessageKey,
  params?: TranslationParams,
) => string;

export {
  formatCompactDate,
  formatFullDate,
  formatMonthName,
  formatMonthYear,
  formatNumber,
  formatWeekdayLong,
  formatWeekdayShort,
} from "@/lib/i18n/format";

export {
  libraryStatusFilterLabel,
  libraryTypeFilterLabel,
  mediaTypeLabel,
} from "@/lib/i18n/labels";

export { translateMoodLabel } from "@/lib/i18n/mood-label";
