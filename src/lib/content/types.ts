export type ContentType = "BOOK" | "MOVIE" | "MUSIC";

export type ContentSource =
  | "douban"
  | "tmdb"
  | "google_books"
  | "open_library"
  | "spotify"
  | "manual";

export type Content = {
  id: string;
  type: ContentType;
  title: string;
  creator: string;
  cover: string;
  description: string;
  tags: string[];
  source: ContentSource;
};

export type MemoryStatus = "WANT" | "READING" | "COMPLETED" | "DROPPED";

export type Memory = {
  id: string;
  contentId: string;
  status: MemoryStatus;
  rating?: number;
  note?: string;
  mood?: string[];
  createdAt: string;
  updatedAt?: string;
};

export type CuratedList = {
  id: string;
  title: string;
  creator: string;
  description: string;
  cover: string;
  items: string[];
};

/** @deprecated Use Memory */
export type UserMemory = Memory;
