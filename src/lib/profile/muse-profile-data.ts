/**
 * Muse Profile — AI Cultural Archive data layer.
 *
 * Current: local mock + store-derived enrichment.
 * Future: replace `resolveMuseProfileData` body with
 *   POST /api/ai/muse-profile  { journalEntries, userMedia, year, month }
 */

import type { ContentType } from "@/lib/content/types";

export type MusePortrait = {
  portraitType: "line-editorial" | "museum-catalogue" | "ai-illustration";
  portraitDescription: string;
  /** Future CDN/AI image URL — null uses local line-art placeholder */
  illustrationUrl: string | null;
};

export type MusePersonaProfile = {
  /** API field: personaName */
  personaName: string;
  description: string;
  confidence: number;
};

export type MuseKeyword = {
  label: string;
  weight: number;
};

export type MuseMonthlyWorkHighlight = {
  title: string;
  creator: string;
  type: ContentType;
};

export type MuseMonthlyReflection = {
  year: number;
  month: number;
  label: string;
  /** Short line shown on the collapsed preview card */
  previewSummary: string;
  journey: {
    books: number;
    movies: number;
    /** Listening volume for the month, displayed as hours */
    musicHours: number;
  };
  moodKeywords: MuseKeyword[];
  aiReflection: string;
  /** Expanded Profile monthly archive fields */
  importantWorks: MuseMonthlyWorkHighlight[];
  personalPatterns: string[];
  recommendations: string[];
  memoryHighlights: string[];
};

export type MuseYearReflection = {
  year: number;
  title: string;
  /** Short line shown on the collapsed preview card */
  previewSummary: string;
  totalMemories: number;
  books: number;
  movies: number;
  music: number;
  /** Main cultural genres for the year archive */
  genres: string[];
  themes: MuseKeyword[];
  aiSummary: string;
};

export type MuseTasteEvolutionPoint = {
  id: string;
  phase: "beginning" | "mid" | "current";
  monthLabel: string;
  personaName: string;
  note: string;
};

export type MuseTasteRankItem = {
  id: string;
  title: string;
  creator: string;
  type: ContentType;
  cover: string;
  resonance: number;
  explanation: string;
};

export type MuseTasteRankings = {
  books: MuseTasteRankItem[];
  movies: MuseTasteRankItem[];
  music: MuseTasteRankItem[];
};

/** Yearly identity evolution — not a media activity feed */
export type MuseTasteTimelineYear = {
  id: string;
  year: number;
  personaName: string;
  note: string;
  keywords: MuseKeyword[];
};

export type MuseDiscoveryPreview = {
  id: string;
  title: string;
  creator: string;
  type: ContentType;
  cover: string;
  reason: string;
  similarTo: string;
  tags: string[];
};

/** Canonical Profile AI payload — API-ready shape */
export type MuseProfileData = {
  portrait: MusePortrait;
  persona: MusePersonaProfile;
  keywords: MuseKeyword[];
  monthlyReflection: MuseMonthlyReflection;
  yearReflection: MuseYearReflection;
  tasteEvolution: MuseTasteEvolutionPoint[];
  tasteRankings: MuseTasteRankings;
  tasteTimeline: MuseTasteTimelineYear[];
  recommendations: MuseDiscoveryPreview[];
  generatedAt: string;
  source: "mock" | "derived" | "ai";
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Static mock baseline — used when stores are sparse */
export const MUSE_PROFILE_MOCK: Omit<
  MuseProfileData,
  "monthlyReflection" | "generatedAt" | "source"
> & {
  monthlyByKey: Record<string, Omit<MuseMonthlyReflection, "year" | "month" | "label">>;
} = {
  portrait: {
    portraitType: "line-editorial",
    portraitDescription:
      "Minimal line-art muse portrait — museum catalogue style, Kinfolk restraint.",
    illustrationUrl: null,
  },
  persona: {
    personaName: "The Quiet Observer",
    description:
      "You are drawn to slow stories, human relationships, and emotional landscapes.",
    confidence: 87,
  },
  keywords: [
    { label: "Nostalgic", weight: 5 },
    { label: "Reflective", weight: 5 },
    { label: "Human Connection", weight: 4 },
    { label: "Slow Cinema", weight: 4 },
    { label: "Dreamy", weight: 3 },
  ],
  yearReflection: {
    year: 2026,
    title: "2026 Cultural Archive",
    previewSummary: "Your year in stories.",
    totalMemories: 42,
    books: 14,
    movies: 16,
    music: 12,
    genres: ["Literary fiction", "Slow cinema", "Intimate albums"],
    themes: [
      { label: "Memory", weight: 5 },
      { label: "Connection", weight: 5 },
      { label: "Exploration", weight: 4 },
      { label: "Quiet", weight: 3 },
    ],
    aiSummary:
      "Your year was shaped by stories about belonging, memory, and human connection — a quiet archive of emotional landscapes.",
  },
  tasteEvolution: [
    {
      id: "2026-beginning",
      phase: "beginning",
      monthLabel: "January",
      personaName: "Curious Explorer",
      note: "Open to new rooms in culture.",
    },
    {
      id: "2026-mid",
      phase: "mid",
      monthLabel: "July",
      personaName: "Quiet Observer",
      note: "Settling into slow stories and emotional landscapes.",
    },
    {
      id: "2026-current",
      phase: "current",
      monthLabel: "Current",
      personaName: "Quiet Observer",
      note: "AI understanding of your taste now.",
    },
  ],
  tasteRankings: {
    books: [
      {
        id: "rank-norwegian-wood",
        title: "Norwegian Wood",
        creator: "Haruki Murakami",
        type: "BOOK",
        cover: "from-emerald-900 via-teal-900 to-slate-950",
        resonance: 96,
        explanation:
          "Your reflections often return to themes of memory, connection, and quiet transformation.",
      },
      {
        id: "rank-kafka-shore",
        title: "Kafka on the Shore",
        creator: "Haruki Murakami",
        type: "BOOK",
        cover: "from-teal-900 via-slate-900 to-stone-950",
        resonance: 91,
        explanation:
          "Dreamlike passages echo your pull toward soft mystery and emotional weather.",
      },
      {
        id: "rank-normal-people",
        title: "Normal People",
        creator: "Sally Rooney",
        type: "BOOK",
        cover: "from-stone-800 via-amber-950 to-neutral-950",
        resonance: 88,
        explanation:
          "Intimate dialogue matches your preference for human-centered, unhurried stories.",
      },
      {
        id: "rank-educated",
        title: "Educated",
        creator: "Tara Westover",
        type: "BOOK",
        cover: "from-stone-900 via-amber-950 to-neutral-950",
        resonance: 84,
        explanation:
          "Identity and memory braid through your notes whenever belonging is in question.",
      },
      {
        id: "rank-on-earth",
        title: "On Earth We're Briefly Gorgeous",
        creator: "Ocean Vuong",
        type: "BOOK",
        cover: "from-rose-950 via-stone-900 to-slate-950",
        resonance: 82,
        explanation:
          "Lyrical tenderness aligns with your quieter emotional landscapes.",
      },
    ],
    movies: [
      {
        id: "rank-perfect-days",
        title: "Perfect Days",
        creator: "Wim Wenders",
        type: "MOVIE",
        cover: "from-stone-700 via-stone-900 to-neutral-950",
        resonance: 95,
        explanation:
          "Ritual and quiet light return in your notes — a film that feels like how you notice.",
      },
      {
        id: "rank-past-lives",
        title: "Past Lives",
        creator: "Celine Song",
        type: "MOVIE",
        cover: "from-slate-700 via-teal-950 to-stone-950",
        resonance: 93,
        explanation:
          "Longing and unfinished connection sit close to your emotional patterns.",
      },
      {
        id: "rank-before-sunrise",
        title: "Before Sunrise",
        creator: "Richard Linklater",
        type: "MOVIE",
        cover: "from-amber-900 via-stone-900 to-neutral-950",
        resonance: 89,
        explanation:
          "Conversational pacing mirrors your taste for intimate, time-shaped cinema.",
      },
      {
        id: "rank-in-mood",
        title: "In the Mood for Love",
        creator: "Wong Kar-wai",
        type: "MOVIE",
        cover: "from-red-950 via-stone-900 to-neutral-950",
        resonance: 87,
        explanation:
          "Withheld emotion and soft color match your slow-cinema affinity.",
      },
      {
        id: "rank-drive-my-car",
        title: "Drive My Car",
        creator: "Ryusuke Hamaguchi",
        type: "MOVIE",
        cover: "from-slate-800 via-teal-950 to-stone-950",
        resonance: 85,
        explanation:
          "Grief spoken gently resonates with your reflective journal voice.",
      },
    ],
    music: [
      {
        id: "rank-carrie-lowell",
        title: "Carrie & Lowell",
        creator: "Sufjan Stevens",
        type: "MUSIC",
        cover: "from-cyan-900 via-teal-950 to-slate-950",
        resonance: 94,
        explanation:
          "Tender grief and hush align with the softer edges of your archive.",
      },
      {
        id: "rank-blonde",
        title: "Blonde",
        creator: "Frank Ocean",
        type: "MUSIC",
        cover: "from-orange-950 via-stone-900 to-neutral-950",
        resonance: 92,
        explanation:
          "Emotional landscapes and restraint match your Quiet Observer listening.",
      },
      {
        id: "rank-in-rainbows",
        title: "In Rainbows",
        creator: "Radiohead",
        type: "MUSIC",
        cover: "from-rose-950 via-stone-900 to-neutral-950",
        resonance: 86,
        explanation:
          "Textural melancholy recurs whenever your journal turns reflective.",
      },
      {
        id: "rank-forever",
        title: "For Emma, Forever Ago",
        creator: "Bon Iver",
        type: "MUSIC",
        cover: "from-sky-950 via-stone-900 to-neutral-950",
        resonance: 84,
        explanation:
          "Sparse warmth returns in months when solitude feels formative.",
      },
      {
        id: "rank-blue",
        title: "Blue",
        creator: "Joni Mitchell",
        type: "MUSIC",
        cover: "from-blue-950 via-slate-900 to-neutral-950",
        resonance: 81,
        explanation:
          "Confessional clarity sits near your preference for honest emotional weather.",
      },
    ],
  },
  tasteTimeline: [
    {
      id: "year-2024",
      year: 2024,
      personaName: "Curious Explorer",
      note: "Open genres, wider sampling, appetite for discovery over depth.",
      keywords: [
        { label: "Discovery", weight: 5 },
        { label: "Fantasy", weight: 4 },
        { label: "Exploration", weight: 4 },
      ],
    },
    {
      id: "year-2025",
      year: 2025,
      personaName: "Story Seeker",
      note: "Narrative gravity — characters, relationships, and emotional arcs.",
      keywords: [
        { label: "Identity", weight: 5 },
        { label: "Relationships", weight: 5 },
        { label: "Story", weight: 3 },
      ],
    },
    {
      id: "year-2026",
      year: 2026,
      personaName: "Quiet Observer",
      note: "Slower media, softer moods, memory as the main genre.",
      keywords: [
        { label: "Memory", weight: 5 },
        { label: "Reflection", weight: 5 },
        { label: "Quiet", weight: 4 },
      ],
    },
  ],
  recommendations: [
    {
      id: "rec-kafka-shore",
      title: "Kafka on the Shore",
      creator: "Haruki Murakami",
      type: "BOOK",
      cover: "from-teal-900 via-slate-900 to-stone-950",
      similarTo: "Norwegian Wood",
      tags: ["identity", "solitude", "memory"],
      reason:
        "Recommended because your memories often return to themes of identity and solitude.",
    },
    {
      id: "rec-past-lives",
      title: "Past Lives",
      creator: "Celine Song",
      type: "MOVIE",
      cover: "from-slate-700 via-teal-950 to-stone-950",
      similarTo: "Perfect Days",
      tags: ["connection", "time", "tenderness"],
      reason:
        "Recommended because you linger with human-centered stillness and unfinished connection.",
    },
    {
      id: "rec-blonde",
      title: "Blonde",
      creator: "Frank Ocean",
      type: "MUSIC",
      cover: "from-orange-950 via-stone-900 to-neutral-950",
      similarTo: "Carrie & Lowell",
      tags: ["memory", "softness", "night"],
      reason:
        "Recommended because intimate soundscapes appear often in your reflective evenings.",
    },
    {
      id: "rec-normal-people",
      title: "Normal People",
      creator: "Sally Rooney",
      type: "BOOK",
      cover: "from-stone-800 via-amber-950 to-neutral-950",
      similarTo: "Norwegian Wood",
      tags: ["intimacy", "connection", "youth"],
      reason:
        "Recommended because your archive favors quiet emotional honesty between people.",
    },
    {
      id: "rec-before-sunrise",
      title: "Before Sunrise",
      creator: "Richard Linklater",
      type: "MOVIE",
      cover: "from-amber-900 via-stone-900 to-neutral-950",
      similarTo: "Past Lives",
      tags: ["conversation", "time", "tenderness"],
      reason:
        "Recommended because conversational pacing mirrors the way you notice intimacy.",
    },
    {
      id: "rec-in-rainbows",
      title: "In Rainbows",
      creator: "Radiohead",
      type: "MUSIC",
      cover: "from-rose-950 via-stone-900 to-neutral-950",
      similarTo: "Blonde",
      tags: ["melancholy", "texture", "night"],
      reason:
        "Recommended because textural melancholy recurs when your journal turns reflective.",
    },
    {
      id: "rec-on-earth",
      title: "On Earth We're Briefly Gorgeous",
      creator: "Ocean Vuong",
      type: "BOOK",
      cover: "from-rose-950 via-stone-900 to-slate-950",
      similarTo: "Educated",
      tags: ["memory", "tenderness", "identity"],
      reason:
        "Recommended because lyrical tenderness aligns with your quieter emotional landscapes.",
    },
    {
      id: "rec-drive-my-car",
      title: "Drive My Car",
      creator: "Ryusuke Hamaguchi",
      type: "MOVIE",
      cover: "from-slate-800 via-teal-950 to-stone-950",
      similarTo: "Perfect Days",
      tags: ["grief", "silence", "reflection"],
      reason:
        "Recommended because grief spoken gently resonates with your reflective journal voice.",
    },
    {
      id: "rec-forever-ago",
      title: "For Emma, Forever Ago",
      creator: "Bon Iver",
      type: "MUSIC",
      cover: "from-sky-950 via-stone-900 to-neutral-950",
      similarTo: "Carrie & Lowell",
      tags: ["solitude", "warmth", "winter"],
      reason:
        "Recommended because sparse warmth returns in months when solitude feels formative.",
    },
    {
      id: "rec-in-mood",
      title: "In the Mood for Love",
      creator: "Wong Kar-wai",
      type: "MOVIE",
      cover: "from-red-950 via-stone-900 to-neutral-950",
      similarTo: "Past Lives",
      tags: ["longing", "color", "restraint"],
      reason:
        "Recommended because withheld emotion and soft color match your slow-cinema affinity.",
    },
    {
      id: "rec-educated",
      title: "Educated",
      creator: "Tara Westover",
      type: "BOOK",
      cover: "from-stone-900 via-amber-950 to-neutral-950",
      similarTo: "Norwegian Wood",
      tags: ["identity", "memory", "belonging"],
      reason:
        "Recommended because identity and memory braid through your notes on belonging.",
    },
    {
      id: "rec-blue",
      title: "Blue",
      creator: "Joni Mitchell",
      type: "MUSIC",
      cover: "from-blue-950 via-slate-900 to-neutral-950",
      similarTo: "Carrie & Lowell",
      tags: ["honesty", "weather", "voice"],
      reason:
        "Recommended because confessional clarity sits near your preference for honest emotional weather.",
    },
    {
      id: "rec-a-month",
      title: "A Month in the Country",
      creator: "J.L. Carr",
      type: "BOOK",
      cover: "from-emerald-950 via-stone-900 to-neutral-950",
      similarTo: "Perfect Days",
      tags: ["quiet", "memory", "summer"],
      reason:
        "Recommended because small restorations and soft seasons fit your Quiet Observer pace.",
    },
    {
      id: "rec-columbus",
      title: "Columbus",
      creator: "Kogonada",
      type: "MOVIE",
      cover: "from-stone-700 via-teal-950 to-neutral-950",
      similarTo: "Perfect Days",
      tags: ["architecture", "stillness", "connection"],
      reason:
        "Recommended because architectural stillness echoes how you frame human presence.",
    },
    {
      id: "rec-helium",
      title: "Helium",
      creator: "Daniel Caesar",
      type: "MUSIC",
      cover: "from-violet-950 via-stone-900 to-neutral-950",
      similarTo: "Blonde",
      tags: ["softness", "night", "intimacy"],
      reason:
        "Recommended because hushed R&B textures match the softer rooms in your archive.",
    },
  ],
  monthlyByKey: {
    "2026-6": {
      previewSummary:
        "Your month gathered warmth — human stories and unhurried evenings.",
      journey: { books: 3, movies: 4, musicHours: 9 },
      moodKeywords: [
        { label: "Warm", weight: 4 },
        { label: "Curious", weight: 3 },
        { label: "Reflective", weight: 3 },
      ],
      aiReflection:
        "June gathered warmth — human stories and unhurried evenings in your archive. You returned to connection without hurry, letting soft moods set the pace.",
      importantWorks: [
        {
          title: "Normal People",
          creator: "Sally Rooney",
          type: "BOOK",
        },
        {
          title: "Before Sunrise",
          creator: "Richard Linklater",
          type: "MOVIE",
        },
        {
          title: "Blonde",
          creator: "Frank Ocean",
          type: "MUSIC",
        },
      ],
      personalPatterns: [
        "Evenings favored conversation-driven stories.",
        "Listening accompanied unhurried reading sessions.",
      ],
      recommendations: [
        "Continue with intimate character studies.",
        "Keep soft night listening close to your journal.",
      ],
      memoryHighlights: [
        "A warm note after Before Sunrise.",
        "Three quiet journal days in a row.",
      ],
    },
    "2026-7": {
      previewSummary:
        "Your month was shaped by quiet stories and human connections.",
      journey: { books: 3, movies: 5, musicHours: 12 },
      moodKeywords: [
        { label: "Nostalgic", weight: 5 },
        { label: "Reflective", weight: 4 },
        { label: "Slow Cinema", weight: 4 },
      ],
      aiReflection:
        "July was filled with quiet stories. You explored more human-centered narratives, lingering with memory, restraint, and soft emotional weather.",
      importantWorks: [
        {
          title: "Norwegian Wood",
          creator: "Haruki Murakami",
          type: "BOOK",
        },
        {
          title: "Perfect Days",
          creator: "Wim Wenders",
          type: "MOVIE",
        },
        {
          title: "Carrie & Lowell",
          creator: "Sufjan Stevens",
          type: "MUSIC",
        },
      ],
      personalPatterns: [
        "Memory and restraint returned across media types.",
        "Slow cinema paced the emotional weather of the month.",
      ],
      recommendations: [
        "Stay with human-centered stillness.",
        "Let reflective albums frame reading nights.",
      ],
      memoryHighlights: [
        "A lasting note beside Norwegian Wood.",
        "Perfect Days marked a calm mid-month pause.",
      ],
    },
    "2026-8": {
      previewSummary:
        "Your month slowed into nostalgic textures and reflective pauses.",
      journey: { books: 2, movies: 3, musicHours: 14 },
      moodKeywords: [
        { label: "Dreamy", weight: 4 },
        { label: "Nostalgic", weight: 3 },
        { label: "Calm", weight: 3 },
      ],
      aiReflection:
        "August slowed further — nostalgic textures and reflective pauses. Listening widened while stories grew quieter and more interior.",
      importantWorks: [
        {
          title: "On Earth We're Briefly Gorgeous",
          creator: "Ocean Vuong",
          type: "BOOK",
        },
        {
          title: "Past Lives",
          creator: "Celine Song",
          type: "MOVIE",
        },
        {
          title: "For Emma, Forever Ago",
          creator: "Bon Iver",
          type: "MUSIC",
        },
      ],
      personalPatterns: [
        "Listening hours rose as reading slowed.",
        "Nostalgia softened into dreamlike calm.",
      ],
      recommendations: [
        "Keep sparse albums near late-night notes.",
        "Favor shorter literary works with lasting residue.",
      ],
      memoryHighlights: [
        "Past Lives left an unfinished tenderness.",
        "A quiet listening streak across three evenings.",
      ],
    },
  },
};

function monthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

function defaultMonthly(
  year: number,
  month: number,
): Omit<MuseMonthlyReflection, "year" | "month" | "label"> {
  const monthName = MONTH_NAMES[month - 1] ?? "This month";
  return {
    previewSummary: `Your ${monthName.toLowerCase()} was shaped by quiet stories and emotional landscapes.`,
    journey: { books: 2, movies: 2, musicHours: 8 },
    moodKeywords: [
      { label: "Reflective", weight: 5 },
      { label: "Nostalgic", weight: 4 },
      { label: "Human", weight: 3 },
    ],
    aiReflection: `${monthName} gathered soft patterns — stories that prefer quiet attention.`,
    importantWorks: MUSE_PROFILE_MOCK.tasteRankings.books.slice(0, 2).map((item) => ({
      title: item.title,
      creator: item.creator,
      type: item.type,
    })),
    personalPatterns: [
      "Quiet attention returned across books, films, and music.",
      "Emotional residue gathered in short journal notes.",
    ],
    recommendations: [
      "Stay near reflective works with human gravity.",
      "Keep slow listening close to your writing.",
    ],
    memoryHighlights: [
      "A soft note marked the middle of the month.",
      "One work lingered longer than the rest.",
    ],
  };
}

export type MuseRankingCandidate = {
  id: string;
  title: string;
  creator: string;
  type: ContentType;
  cover: string;
  rating?: number;
  note?: string;
  status?: string;
  tags?: string[];
  revisited?: boolean;
};

const EMOTIONAL_KEYWORDS = [
  "memory",
  "nostalgic",
  "quiet",
  "reflective",
  "tender",
  "human",
  "connection",
  "melancholy",
  "gentle",
  "dream",
  "slow",
  "intimate",
];

function scoreResonance(candidate: MuseRankingCandidate): number {
  let score = 52;

  if (candidate.rating && candidate.rating > 0) {
    score += candidate.rating * 6;
  }

  const note = (candidate.note ?? "").trim();
  if (note.length > 40) score += 10;
  else if (note.length > 10) score += 5;

  if (/finished|completed|done/i.test(candidate.status ?? "")) score += 8;
  if (/reading|watching|listening|ongoing/i.test(candidate.status ?? "")) {
    score += 4;
  }

  if (candidate.revisited) score += 7;

  const blob = `${note} ${(candidate.tags ?? []).join(" ")}`.toLowerCase();
  let emotionHits = 0;
  for (const keyword of EMOTIONAL_KEYWORDS) {
    if (blob.includes(keyword)) emotionHits += 1;
  }
  score += Math.min(12, emotionHits * 3);

  return Math.min(98, Math.max(62, Math.round(score)));
}

function explanationFor(
  candidate: MuseRankingCandidate,
  resonance: number,
): string {
  const tags = (candidate.tags ?? []).slice(0, 3);
  if (tags.length >= 2) {
    return `Your reflections often return to themes of ${tags[0]}, ${tags[1]}, and quiet transformation.`;
  }
  if ((candidate.note ?? "").length > 20) {
    return `Journal notes around this work show lasting emotional residue — ${resonance}% resonance with your archive.`;
  }
  return `Completion, rating, and emotional keywords place this near the center of your taste.`;
}

/** Rank store works by AI resonance; falls back to mock when sparse. */
export function buildTasteRankings(
  candidates: MuseRankingCandidate[],
): MuseTasteRankings {
  const scored = candidates
    .map((candidate) => {
      const resonance = scoreResonance(candidate);
      return {
        id: candidate.id,
        title: candidate.title,
        creator: candidate.creator,
        type: candidate.type,
        cover: candidate.cover,
        resonance,
        explanation: explanationFor(candidate, resonance),
      } satisfies MuseTasteRankItem;
    })
    .sort((a, b) => b.resonance - a.resonance);

  const pick = (type: ContentType) =>
    scored.filter((item) => item.type === type).slice(0, 5);

  const books = pick("BOOK");
  const movies = pick("MOVIE");
  const music = pick("MUSIC");

  return {
    books: books.length > 0 ? books : MUSE_PROFILE_MOCK.tasteRankings.books,
    movies: movies.length > 0 ? movies : MUSE_PROFILE_MOCK.tasteRankings.movies,
    music: music.length > 0 ? music : MUSE_PROFILE_MOCK.tasteRankings.music,
  };
}

/**
 * Resolve Profile AI Cultural Archive for a selected month.
 * Prefers mock monthly templates; live store counts can override via `overrides`.
 */
export function resolveMuseProfileData(
  year: number,
  month: number,
  overrides?: {
    persona?: Partial<MusePersonaProfile>;
    keywords?: MuseKeyword[];
    journey?: Partial<MuseMonthlyReflection["journey"]>;
    yearStats?: Partial<
      Pick<MuseYearReflection, "totalMemories" | "books" | "movies" | "music">
    >;
    tasteRankings?: MuseTasteRankings;
    tasteTimeline?: MuseTasteTimelineYear[];
    source?: MuseProfileData["source"];
  },
): MuseProfileData {
  const key = monthKey(year, month);
  const monthlyBase =
    MUSE_PROFILE_MOCK.monthlyByKey[key] ?? defaultMonthly(year, month);

  const persona: MusePersonaProfile = {
    ...MUSE_PROFILE_MOCK.persona,
    ...overrides?.persona,
  };

  const currentName = persona.personaName.replace(/^The\s+/i, "");

  const monthlyReflection: MuseMonthlyReflection = {
    year,
    month,
    label: `${MONTH_NAMES[month - 1]} ${year}`,
    previewSummary: monthlyBase.previewSummary,
    journey: {
      ...monthlyBase.journey,
      ...overrides?.journey,
    },
    moodKeywords: monthlyBase.moodKeywords,
    aiReflection: monthlyBase.aiReflection,
    importantWorks: monthlyBase.importantWorks,
    personalPatterns: monthlyBase.personalPatterns,
    recommendations: monthlyBase.recommendations,
    memoryHighlights: monthlyBase.memoryHighlights,
  };

  const yearReflection: MuseYearReflection = {
    ...MUSE_PROFILE_MOCK.yearReflection,
    year,
    title: `${year} Cultural Archive`,
    previewSummary: MUSE_PROFILE_MOCK.yearReflection.previewSummary,
    genres: MUSE_PROFILE_MOCK.yearReflection.genres,
    ...overrides?.yearStats,
  };

  const tasteTimeline = (
    overrides?.tasteTimeline ?? MUSE_PROFILE_MOCK.tasteTimeline
  ).map((point) =>
    point.year === year
      ? { ...point, personaName: currentName }
      : point,
  );

  return {
    portrait: MUSE_PROFILE_MOCK.portrait,
    persona,
    keywords: overrides?.keywords ?? MUSE_PROFILE_MOCK.keywords,
    monthlyReflection,
    yearReflection,
    tasteEvolution: MUSE_PROFILE_MOCK.tasteEvolution.map((point) =>
      point.phase === "current"
        ? { ...point, personaName: currentName }
        : point,
    ),
    tasteRankings: overrides?.tasteRankings ?? MUSE_PROFILE_MOCK.tasteRankings,
    tasteTimeline,
    recommendations: MUSE_PROFILE_MOCK.recommendations,
    generatedAt: new Date().toISOString(),
    source: overrides?.source ?? "mock",
  };
}

export function shiftMuseMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
  };
}

export function formatMuseMonthShort(year: number, month: number): string {
  const short = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${short[month - 1]} ${year}`;
}

export type MuseMonthlyReportEntry = {
  year: number;
  month: number;
  label: string;
  previewSummary: string;
};

/** Profile archive index into Journal monthly reports — labels only, no duplicated body. */
export function listMuseMonthlyReports(): MuseMonthlyReportEntry[] {
  const fromMock = Object.keys(MUSE_PROFILE_MOCK.monthlyByKey).map((key) => {
    const [year, month] = key.split("-").map(Number);
    const base = MUSE_PROFILE_MOCK.monthlyByKey[key];
    return {
      year,
      month,
      label: `${MONTH_NAMES[month - 1]} ${year}`,
      previewSummary: base.previewSummary,
    } satisfies MuseMonthlyReportEntry;
  });

  const hasSeptember = fromMock.some(
    (entry) => entry.year === 2026 && entry.month === 9,
  );
  if (!hasSeptember) {
    fromMock.push({
      year: 2026,
      month: 9,
      label: "September 2026",
      previewSummary: defaultMonthly(2026, 9).previewSummary,
    });
  }

  return fromMock.sort((left, right) => {
    if (left.year !== right.year) return right.year - left.year;
    return right.month - left.month;
  });
}
