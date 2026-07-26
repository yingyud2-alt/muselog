import type { UserMediaStatus } from "@/lib/content/user-media-state";

export type LibraryMediaType = "BOOK" | "MOVIE" | "MUSIC";

export type LibraryTypeFilter = "all" | LibraryMediaType;

export type LibraryStatusFilter = "all" | "WANT" | "ONGOING" | "FINISHED";

export type LibrarySort =
  | "recently-updated"
  | "recently-added"
  | "title"
  | "highest-rated";

export type LibraryItem = {
  mediaKey: string;
  contentId: string | null;
  title: string;
  creator: string;
  cover: string;
  type: LibraryMediaType;
  status: Exclude<UserMediaStatus, "NONE">;
  progress?: number;
  rating?: number;
  shortReview?: string;
  notes?: string;
  startDate?: string;
  endDate?: string;
  addedToJournal: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LibraryStats = {
  total: number;
  want: number;
  ongoing: number;
  finished: number;
};
