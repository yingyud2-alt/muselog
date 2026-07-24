import type { CuratedList } from "./types";

export const CURATED_LISTS: CuratedList[] = [
  {
    id: "list-rainy-day-cinema",
    title: "🌧 Movies for rainy nights",
    creator: "MuseLog",
    description: "Slow films, soft light, and the kind of silence that feels like shelter.",
    cover: "from-slate-700 via-blue-950 to-slate-950",
    items: [
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
    items: [
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
    items: [
      "music-for-emma-forever-ago",
      "music-carrie-and-lowell",
      "music-blonde",
    ],
  },
];

export function getCuratedListById(id: string): CuratedList | undefined {
  return CURATED_LISTS.find((list) => list.id === id);
}
