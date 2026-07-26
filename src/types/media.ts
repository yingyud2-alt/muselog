export type MediaType = "book" | "movie" | "music";

/** API-facing media category labels */
export type MediaEventType = "BOOK" | "MOVIE" | "MUSIC";

export type MediaStatus = "WANT" | "READING" | "FINISHED";

export type JourneyColor = "teal" | "cyan" | "amber" | "olive";

/** API-ready media journal entry. */
export interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  cover: string;
  creator: string;
  rating: number;
  status: MediaStatus;
  date: string;
  quote: string;
  /** Personal journal note */
  note: string;
  /** Alias for note — API / DB field */
  notes?: string;
  tags: string[];
  /** Time spent with this work (minutes) */
  duration?: number;
  /** Photo memory URLs */
  memories?: string[];
  /** Journey start (relationship began) */
  startDate?: string;
  /** Journey end (relationship concluded) */
  endDate?: string;
  /** Highlighter color for journey bar */
  journeyColor?: JourneyColor;
  /** Optional moment context, e.g. "listened at night" */
  moment?: string;
}

/** Visual timeline event on the calendar grid. */
export interface MediaEvent {
  id: string;
  title: string;
  type: MediaEventType;
  cover: string;
  startDate: string;
  endDate: string;
  status: MediaStatus;
  journeyColor: JourneyColor;
  rating: number;
}

/** @deprecated Use MediaItem */
export type MediaMemory = MediaItem;

/** Maps calendar entries to Explore content ids for “View detail”. */
export const MEDIA_EXPLORE_IDS: Record<string, string> = {
  "calendar-norwegian-wood": "book-norwegian-wood",
  "calendar-perfect-days": "movie-perfect-days",
  "calendar-carrie-and-lowell": "music-carrie-and-lowell",
};

export const JOURNEY_COLOR_STYLES: Record<
  JourneyColor,
  { highlight: string; label: string }
> = {
  teal: { highlight: "bg-teal-400/45", label: "Teal" },
  cyan: { highlight: "bg-cyan-400/42", label: "Cyan" },
  amber: { highlight: "bg-amber-400/42", label: "Amber" },
  olive: { highlight: "bg-lime-600/40", label: "Olive" },
};

export const JOURNEY_COLOR_OPTIONS: JourneyColor[] = [
  "teal",
  "cyan",
  "amber",
  "olive",
];

export const TYPE_JOURNEY_COLORS: Record<MediaType, JourneyColor> = {
  book: "teal",
  movie: "amber",
  music: "olive",
};

export const CALENDAR_MOCK_MEDIA: MediaItem[] = [
  {
    id: "calendar-norwegian-wood",
    type: "book",
    title: "Norwegian Wood",
    creator: "Haruki Murakami",
    cover: "from-emerald-900 via-teal-900 to-slate-950",
    status: "FINISHED",
    rating: 5,
    quote:
      "Sometimes memories arrive like rain — quiet, persistent, impossible to ignore.",
    note: "What this work left me with: a tender ache for youth, and the sense that love can be both healing and unbearable.",
    tags: ["nostalgic", "rainy", "quiet"],
    moment: "read on a rainy afternoon",
    date: "2026-07-12",
    startDate: "2026-07-12",
    endDate: "2026-07-20",
    journeyColor: "teal",
    duration: 480,
    memories: [],
  },
  {
    id: "calendar-perfect-days",
    type: "movie",
    title: "Perfect Days",
    creator: "Wim Wenders",
    cover: "from-stone-700 via-stone-900 to-neutral-950",
    status: "FINISHED",
    rating: 5,
    quote: "Create before you consume.",
    note: "What this work left me with: reverence for small rituals — the way ordinary light can feel sacred if you stay still enough to notice.",
    tags: ["calm", "reflective", "gentle"],
    moment: "watched at dusk",
    date: "2026-07-15",
    startDate: "2026-07-15",
    endDate: "2026-07-15",
    journeyColor: "amber",
    duration: 90,
    memories: [],
  },
  {
    id: "calendar-carrie-and-lowell",
    type: "music",
    title: "Carrie & Lowell",
    creator: "Sufjan Stevens",
    cover: "from-cyan-900 via-teal-950 to-slate-950",
    status: "FINISHED",
    rating: 5,
    quote: "Find beauty in silence.",
    note: "What this work left me with: grief rendered in the gentlest tones — like walking home alone when the city has gone quiet.",
    tags: ["melancholy", "tender", "night"],
    moment: "listened at night",
    date: "2026-07-20",
    startDate: "2026-07-20",
    endDate: "2026-07-20",
    journeyColor: "olive",
    duration: 45,
    memories: [],
  },
];
