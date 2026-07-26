import type { MediaItem, MediaType } from "@/types/media";

export type LibraryEntry = MediaItem & {
  progress?: number;
};

export const LIBRARY_MOCK: LibraryEntry[] = [
  {
    id: "lib-kafka-on-the-shore",
    type: "book",
    title: "Kafka on the Shore",
    creator: "Haruki Murakami",
    cover: "from-indigo-900 via-violet-900 to-slate-950",
    status: "READING",
    rating: 0,
    quote: "",
    note: "",
    tags: ["dreamlike", "curious"],
    date: "2026-07-08",
    progress: 70,
  },
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
    note: "What this work left me with: a tender ache for youth.",
    tags: ["nostalgic", "rainy", "quiet"],
    date: "2026-07-12",
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
    note: "Reverence for small rituals.",
    tags: ["calm", "reflective", "gentle"],
    date: "2026-07-15",
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
    note: "Grief rendered in the gentlest tones.",
    tags: ["melancholy", "tender", "night"],
    date: "2026-07-20",
  },
  {
    id: "lib-before-sunrise",
    type: "movie",
    title: "Before Sunrise",
    creator: "Richard Linklater",
    cover: "from-rose-900 via-red-950 to-neutral-950",
    status: "WANT",
    rating: 0,
    quote: "",
    note: "",
    tags: ["nostalgic", "romantic"],
    date: "2026-07-22",
  },
  {
    id: "lib-blue-note",
    type: "music",
    title: "Kind of Blue",
    creator: "Miles Davis",
    cover: "from-blue-950 via-slate-900 to-black",
    status: "READING",
    rating: 0,
    quote: "",
    note: "",
    tags: ["calm", "night"],
    date: "2026-07-24",
    progress: 45,
  },
];

export function filterLibraryByType(
  items: LibraryEntry[],
  type: MediaType | "all",
): LibraryEntry[] {
  if (type === "all") {
    return items;
  }

  return items.filter((item) => item.type === type);
}
