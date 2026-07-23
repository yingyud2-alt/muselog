import {
  BookOpen,
  Film,
  Headphones,
  type LucideIcon,
} from "lucide-react";

export type MediaType = "book" | "movie";

export type ContinueReadingItem = {
  title: string;
  subtitle: string;
  type: MediaType;
  progress: number;
  coverClassName: string;
  lastOpened: string;
};

export type RecentlyAddedItem = {
  title: string;
  subtitle: string;
  type: MediaType;
  coverClassName: string;
  addedAt: string;
};

export type StatItem = {
  label: string;
  value: number;
  icon: LucideIcon;
  description: string;
};

export const continueReading: ContinueReadingItem[] = [
  {
    title: "Norwegian Wood",
    subtitle: "Haruki Murakami",
    type: "book",
    progress: 68,
    lastOpened: "2 days ago",
    coverClassName: "from-emerald-700 via-teal-800 to-slate-900",
  },
  {
    title: "Atomic Habits",
    subtitle: "James Clear",
    type: "book",
    progress: 42,
    lastOpened: "Yesterday",
    coverClassName: "from-amber-500 via-orange-600 to-rose-700",
  },
];

export const recentlyAdded: RecentlyAddedItem[] = [
  {
    title: "Interstellar",
    subtitle: "Christopher Nolan",
    type: "movie",
    addedAt: "Today",
    coverClassName: "from-slate-800 via-indigo-950 to-black",
  },
  {
    title: "Merry Christmas Mr. Lawrence",
    subtitle: "Nagisa Oshima",
    type: "movie",
    addedAt: "3 days ago",
    coverClassName: "from-stone-600 via-neutral-700 to-zinc-900",
  },
];

export const readingStats: StatItem[] = [
  {
    label: "books",
    value: 12,
    icon: BookOpen,
    description: "Finished this year",
  },
  {
    label: "movies",
    value: 8,
    icon: Film,
    description: "Logged in your journal",
  },
  {
    label: "hours listening",
    value: 24,
    icon: Headphones,
    description: "Music & podcasts",
  },
];
