import type { LibraryItem } from "@/lib/library/library-types";
import type { MediaItem } from "@/types/media";

export interface ReflectionMediaStats {
  books: number;
  movies: number;
  music: number;
  journalDays: number;
}

export interface ReflectionJourneyEntry {
  id: string;
  title: string;
  creator: string;
  cover: string;
  typeLabel: string;
  statusLabel: string;
  date: string;
  dateLabel: string;
  journalItem: MediaItem;
}

export interface ReflectionTasteTag {
  label: string;
  weight: number;
}

export interface ReflectionMoodTag {
  label: string;
  weight: number;
}

export interface ReflectionInput {
  month: string;
  monthYear: string;
  mediaStats: ReflectionMediaStats;
  completedWorks: LibraryItem[];
  ongoingWorks: LibraryItem[];
  tasteTags: ReflectionTasteTag[];
  moodTags: ReflectionMoodTag[];
  journalEntries: MediaItem[];
}

export interface ReflectionResult {
  summary: string;
  insights: string[];
  patterns: string[];
  exploration: string[];
}

export interface ReflectionPreview {
  summary: string;
  month: string;
  monthYear: string;
}

export interface MonthlyReflectionData {
  month: string;
  monthYear: string;
  mediaStats: ReflectionMediaStats;
  journey: ReflectionJourneyEntry[];
  tasteTags: ReflectionTasteTag[];
  moodTags: ReflectionMoodTag[];
  completedWorks: LibraryItem[];
  ongoingWorks: LibraryItem[];
  monthJournalEntries: MediaItem[];
  reflection: ReflectionResult;
  preview: ReflectionPreview;
}
