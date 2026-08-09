"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  dictionaries,
  readStoredLocale,
  translate,
  writeStoredLocale,
  type Locale,
  type MessageDictionary,
  type MessageKey,
  type TranslateFn,
  type TranslationParams,
} from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
  messages: MessageDictionary;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type Listener = () => void;

let storeLocale: Locale = DEFAULT_LOCALE;
/** Gates localStorage until after mount so SSR + first client paint match. */
let storeHydrated = false;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Locale {
  return storeHydrated ? storeLocale : DEFAULT_LOCALE;
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

function applyDocumentLang(locale: Locale) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.lang = locale;
}

function commitLocale(locale: Locale, persist: boolean) {
  storeLocale = locale;
  storeHydrated = true;
  if (persist) {
    writeStoredLocale(locale);
  }
  applyDocumentLang(locale);
  emit();
}

function hydrateLocaleStore() {
  const saved = readStoredLocale();
  storeHydrated = true;
  if (saved && saved !== storeLocale) {
    storeLocale = saved;
  }
  applyDocumentLang(storeLocale);
  emit();
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    hydrateLocaleStore();
  }, []);

  const setLocale = useCallback((next: Locale) => {
    if (next === storeLocale && storeHydrated) {
      applyDocumentLang(next);
      return;
    }
    commitLocale(next, true);
  }, []);

  const t = useCallback<TranslateFn>(
    (key: MessageKey, params?: TranslationParams) =>
      translate(locale, key, params),
    [locale],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      messages: dictionaries[locale],
    }),
    [locale, setLocale, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
