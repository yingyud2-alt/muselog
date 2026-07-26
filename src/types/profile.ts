import type { LibraryItem } from "@/lib/library/library-types";
import type { MediaItem } from "@/types/media";

export interface ProfileStats {
  total: number;
  books: number;
  movies: number;
  music: number;
  finished: number;
  ongoing: number;
}

export interface ProfileIdentity {
  displayName: string;
  totalMemories: number;
  memberSince: string;
}

export interface MusePersona {
  title: string;
  description: string;
  /** 0–100 portrait confidence from taste signal strength */
  confidence?: number;
}

export interface TasteTag {
  label: string;
  weight: number;
}

export interface MonthlyReflection {
  month: string;
  books: number;
  movies: number;
  music: number;
  journalDays: number;
  streak: number;
}

export interface ProfileTimelineEntry {
  id: string;
  title: string;
  creator: string;
  typeLabel: string;
  statusLabel: string;
  date: string;
  journalItem: MediaItem;
}

export interface ProfileTimelineMonth {
  month: string;
  entries: ProfileTimelineEntry[];
}

export interface ProfileTimelineYear {
  year: string;
  months: ProfileTimelineMonth[];
}

export interface TasteTimelineMoment {
  id: string;
  year: string;
  month: string;
  insight: string;
  entryCount: number;
}

export interface MemoryHighlight {
  id: string;
  title: string;
  creator: string;
  date: string;
  excerpt: string;
  journalItem: MediaItem;
}

export type CurrentJourneyItem = LibraryItem;

export type ProfileFavorite = LibraryItem;
