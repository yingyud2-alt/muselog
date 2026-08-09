export const LOCALES = ["zh-CN", "en-US"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh-CN";

export const LOCALE_STORAGE_KEY = "muselog-locale-v1";
/** Previous key — read once and migrate. */
export const LEGACY_LOCALE_STORAGE_KEY = "yiyu-locale-v1";

/** Nested message dictionaries — leave values as strings. */
export type MessageDictionary = {
  brand: {
    /** Primary brand mark: 忆屿 (zh) / MuseLog (en) */
    name: string;
    /** English signature under Chinese name; empty in en-US */
    signature: string;
    /** English slogan: Your Emotional Archipelago */
    slogan: string;
    /** Chinese brand line; empty in en-US */
    line: string;
    tagline: string;
  };
  nav: {
    home: string;
    homeEn: string;
    explore: string;
    exploreEn: string;
    library: string;
    libraryEn: string;
    journal: string;
    journalEn: string;
    calendar: string;
    calendarEn: string;
    reflection: string;
    reflectionEn: string;
    profile: string;
    profileEn: string;
    search: string;
    desktopAria: string;
    mobileAria: string;
  };
  action: {
    add: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    close: string;
    viewDetails: string;
    addToLibrary: string;
    addToJournal: string;
    remove: string;
    retry: string;
    loading: string;
    seeMore: string;
    showLess: string;
  };
  media: {
    book: string;
    books: string;
    movie: string;
    movies: string;
    music: string;
    podcast: string;
    podcasts: string;
    all: string;
  };
  status: {
    want: string;
    inProgress: string;
    finished: string;
    dropped: string;
    reading: string;
  };
  page: {
    moodRecommendation: string;
    museAiPicks: string;
    yourJourney: string;
    aiReflection: string;
    aboutThisWork: string;
    whatToExpect: string;
    communityRating: string;
    myJourney: string;
    similarWorks: string;
    journalMemory: string;
    editMemory: string;
    viewWorkDetail: string;
  };
  hero: {
    title: string;
    subtitle: string;
    surpriseMuse: string;
  };
  bubble: {
    viewOriginal: string;
    viewTranslation: string;
  };
  mood: {
    reflective: string;
    calm: string;
    hopeful: string;
    dreamy: string;
    warm: string;
    melancholic: string;
    curious: string;
    nostalgic: string;
    romantic: string;
    intense: string;
    quiet: string;
  };
  empty: {
    genericTitle: string;
    genericDescription: string;
    searchTitle: string;
    searchDescription: string;
    retryHint: string;
  };
  language: {
    label: string;
    zh: string;
    en: string;
  };
};

export type MessageKey = {
  [G in keyof MessageDictionary]: {
    [K in keyof MessageDictionary[G]]: `${G & string}.${K & string}`;
  }[keyof MessageDictionary[G]];
}[keyof MessageDictionary];

export type TranslationParams = Record<string, string | number>;

export type NavTitleKey =
  | "nav.home"
  | "nav.explore"
  | "nav.library"
  | "nav.journal"
  | "nav.calendar"
  | "nav.reflection"
  | "nav.profile";

export type NavSubtitleKey =
  | "nav.homeEn"
  | "nav.exploreEn"
  | "nav.libraryEn"
  | "nav.journalEn"
  | "nav.calendarEn"
  | "nav.reflectionEn"
  | "nav.profileEn";
