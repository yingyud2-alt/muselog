import type { Content } from "./types";

/**
 * FALLBACK / seed catalog only — not the primary public content source.
 *
 * Prefer API-imported Works (Open Library, future TMDB/Spotify) via
 * `imported-work-catalog` whenever identity matches.
 * Keep this file until Explore discovery is fully API-driven.
 *
 * @see src/lib/work/content-layers.ts
 */
export const CONTENT_CATALOG: Content[] = [
  {
    id: "book-norwegian-wood",
    type: "BOOK",
    title: "Norwegian Wood",
    creator: "Haruki Murakami",
    cover: "from-emerald-900 via-teal-900 to-slate-950",
    description:
      "A tender coming-of-age story where love and loss drift through 1960s Tokyo like a quiet, persistent rain.",
    tags: ["nostalgic", "melancholy", "longing", "gentle"],
    source: "manual",
  },
  {
    id: "book-kafka-on-the-shore",
    type: "BOOK",
    title: "Kafka on the Shore",
    creator: "Haruki Murakami",
    cover: "from-indigo-900 via-violet-900 to-slate-950",
    description:
      "A mysterious story about identity and dreams, where fate and consciousness walk parallel paths.",
    tags: ["dreamlike", "surreal", "curious", "strange"],
    source: "manual",
  },
  {
    id: "book-the-little-prince",
    type: "BOOK",
    title: "The Little Prince",
    creator: "Antoine de Saint-Exupéry",
    cover: "from-amber-800 via-orange-950 to-slate-950",
    description:
      "A gentle fable about wonder, loneliness, and the invisible truths we carry from childhood.",
    tags: ["quiet", "nostalgic", "gentle", "reflective"],
    source: "manual",
  },
  {
    id: "movie-perfect-days",
    type: "MOVIE",
    title: "Perfect Days",
    creator: "Wim Wenders",
    cover: "from-stone-700 via-stone-900 to-neutral-950",
    description:
      "Beauty found in routine — a quiet portrait of solitude, ritual, and small everyday grace.",
    tags: ["quiet", "calm", "reflective", "still"],
    source: "manual",
  },
  {
    id: "movie-before-sunrise",
    type: "MOVIE",
    title: "Before Sunrise",
    creator: "Richard Linklater",
    cover: "from-rose-900 via-red-950 to-neutral-950",
    description:
      "One night in Vienna, two strangers talk until dawn — conversation as romance, time as magic.",
    tags: ["nostalgic", "romantic", "curious", "warm"],
    source: "manual",
  },
  {
    id: "movie-in-the-mood-for-love",
    type: "MOVIE",
    title: "In the Mood for Love",
    creator: "Wong Kar-wai",
    cover: "from-fuchsia-900 via-purple-950 to-slate-950",
    description:
      "Restrained longing in 1962 Hong Kong — love observed from a distance, never fully spoken.",
    tags: ["melancholy", "nostalgic", "longing", "bittersweet"],
    source: "manual",
  },
  {
    id: "music-blonde",
    type: "MUSIC",
    title: "Blonde",
    creator: "Frank Ocean",
    cover: "from-sky-900 via-blue-950 to-slate-950",
    description:
      "An intimate drift through identity and desire — confession blurred with abstraction.",
    tags: ["dreamy", "melancholy", "intense", "reflective"],
    source: "manual",
  },
  {
    id: "music-carrie-and-lowell",
    type: "MUSIC",
    title: "Carrie & Lowell",
    creator: "Sufjan Stevens",
    cover: "from-cyan-900 via-teal-950 to-slate-950",
    description:
      "Sparse songs of grief and memory — a record written in the wake of loss.",
    tags: ["nostalgic", "melancholy", "quiet", "bittersweet"],
    source: "manual",
  },
  {
    id: "music-for-emma-forever-ago",
    type: "MUSIC",
    title: "For Emma, Forever Ago",
    creator: "Bon Iver",
    cover: "from-slate-700 via-slate-900 to-black",
    description:
      "Winter solitude captured in fragile harmonies — songs that feel like a cabin at dusk.",
    tags: ["quiet", "nostalgic", "gentle", "cozy"],
    source: "manual",
  },
];

export function getContentById(id: string): Content | undefined {
  return CONTENT_CATALOG.find((item) => item.id === id);
}

export function getContentsByIds(ids: string[]): Content[] {
  const map = new Map(CONTENT_CATALOG.map((item) => [item.id, item]));

  return ids
    .map((id) => map.get(id))
    .filter((item): item is Content => item !== undefined);
}

export function getContentByType(type: Content["type"]): Content[] {
  return CONTENT_CATALOG.filter((item) => item.type === type);
}
