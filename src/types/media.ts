export type MediaType = "book" | "movie" | "music";

/** API-facing media category labels */
export type MediaEventType = "BOOK" | "MOVIE" | "MUSIC";

export type MediaStatus = "WANT" | "READING" | "FINISHED";

/** Per-memory journey color — persisted as journal entry journeyColor / color */
export type JourneyColor =
  | "mint"
  | "teal"
  | "ocean"
  | "sage"
  | "beige"
  | "lavender";

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
  /** Explicit minutes for check-ins / analytics (preferred numeric field) */
  durationMinutes?: number;
  /** Photo memory URLs */
  memories?: string[];
  /** Journey start (relationship began) */
  startDate?: string;
  /** Journey end (relationship concluded) */
  endDate?: string;
  /** Highlighter color for this memory/journey (also known as color) */
  journeyColor?: JourneyColor;
  /** Optional alias for journeyColor — API / future schema */
  color?: JourneyColor;
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

export const JOURNEY_COLOR_SWATCHES: Record<JourneyColor, string> = {
  mint: "#6ED4B8",
  teal: "#5CB8A6",
  ocean: "#5A9BC4",
  sage: "#8AAE9A",
  beige: "#C4B8A8",
  lavender: "#9AA8B8",
};

export const JOURNEY_COLOR_STYLES: Record<
  JourneyColor,
  { highlight: string; label: string; swatch: string }
> = {
  mint: { highlight: "bg-[#6ED4B8]/55", label: "Mint", swatch: "#6ED4B8" },
  teal: { highlight: "bg-[#5CB8A6]/55", label: "Teal", swatch: "#5CB8A6" },
  ocean: { highlight: "bg-[#5A9BC4]/55", label: "Ocean", swatch: "#5A9BC4" },
  sage: { highlight: "bg-[#8AAE9A]/55", label: "Sage", swatch: "#8AAE9A" },
  beige: { highlight: "bg-[#C4B8A8]/55", label: "Beige", swatch: "#C4B8A8" },
  lavender: {
    highlight: "bg-[#9AA8B8]/55",
    label: "Lavender",
    swatch: "#9AA8B8",
  },
};

export const JOURNEY_COLOR_OPTIONS: JourneyColor[] = [
  "mint",
  "teal",
  "ocean",
  "sage",
  "beige",
  "lavender",
];

export const TYPE_JOURNEY_COLORS: Record<MediaType, JourneyColor> = {
  book: "ocean",
  movie: "sage",
  music: "mint",
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
    date: "2026-07-20",
    startDate: "2026-07-20",
    endDate: "2026-07-28",
    journeyColor: "ocean",
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
    journeyColor: "sage",
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
    journeyColor: "mint",
    duration: 45,
    memories: [],
  },
];
