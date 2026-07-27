import type { CuratedList } from "./types";

/**
 * Curated list shell for Explore UI.
 * Item ids are filled by the Explore public-catalog adapter from Open Library
 * (`apiCategory`). `fallbackItems` are mock CONTENT_CATALOG ids used only when
 * the API catalog is unavailable — do not treat them as primary discovery.
 */
export type CuratedListDefinition = Omit<CuratedList, "items"> & {
  /** Open Library subject used when API discovery succeeds. */
  apiCategory: string;
  /** Mock catalog ids — fallback only. */
  fallbackItems: string[];
};

export const CURATED_LIST_DEFINITIONS: CuratedListDefinition[] = [
  {
    id: "list-rainy-day-cinema",
    title: "🌧 Movies for rainy nights",
    creator: "MuseLog",
    description: "Slow films, soft light, and the kind of silence that feels like shelter.",
    cover: "from-slate-700 via-blue-950 to-slate-950",
    apiCategory: "literary fiction",
    fallbackItems: [
      "movie-before-sunrise",
      "movie-perfect-days",
      "movie-in-the-mood-for-love",
    ],
  },
  {
    id: "list-books-like-memories",
    title: "📖 Books that feel like memories",
    creator: "MuseLog",
    description: "Stories that linger — half-remembered, tender, and quietly surreal.",
    cover: "from-indigo-900 via-violet-950 to-slate-950",
    apiCategory: "memoir",
    fallbackItems: [
      "book-norwegian-wood",
      "book-kafka-on-the-shore",
      "book-the-little-prince",
    ],
  },
  {
    id: "list-late-night-walks",
    title: "🌙 Songs for late night walks",
    creator: "MuseLog",
    description: "Music for empty streets, dim lamps, and thoughts you can't quite name.",
    cover: "from-cyan-900 via-teal-950 to-black",
    apiCategory: "poetry",
    fallbackItems: [
      "music-for-emma-forever-ago",
      "music-carrie-and-lowell",
      "music-blonde",
    ],
  },
];

/** @deprecated Prefer CURATED_LIST_DEFINITIONS + Explore adapter. Kept for fallback shape. */
export const CURATED_LISTS: CuratedList[] = CURATED_LIST_DEFINITIONS.map(
  (list) => ({
    id: list.id,
    title: list.title,
    creator: list.creator,
    description: list.description,
    cover: list.cover,
    items: list.fallbackItems,
  }),
);

export function getCuratedListById(id: string): CuratedList | undefined {
  return CURATED_LISTS.find((list) => list.id === id);
}
