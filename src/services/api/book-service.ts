import { createImportedWork, openLibraryWorkId } from "@/lib/work/create-imported-work";
import type { BookService } from "@/services/api/media-service-types";
import type { Work, WorkListResult } from "@/services/types/work";

export const OPEN_LIBRARY_SOURCE = "open_library";

/** Base URL for Open Library — override via OPEN_LIBRARY_API_URL. */
export function getOpenLibraryApiUrl(): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.OPEN_LIBRARY_API_URL?.trim()
      : undefined;
  return fromEnv && fromEnv.length > 0
    ? fromEnv.replace(/\/$/, "")
    : "https://openlibrary.org";
}

/**
 * Raw Open Library search doc shape (subset).
 * Kept here so the live search mapper can land without new layers.
 */
export type OpenLibrarySearchDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  subject?: string[];
  number_of_pages_median?: number;
};

/** Map an Open Library search doc → MuseLog Work (cover → coverUrl). */
export function mapOpenLibraryDocToWork(doc: OpenLibrarySearchDoc): Work | null {
  const externalId = doc.key?.trim();
  if (!externalId) return null;

  const title = doc.title?.trim();
  if (!title) return null;

  const creator =
    doc.author_name?.find((name) => name.trim())?.trim() || "Unknown";

  const coverUrl =
    typeof doc.cover_i === "number"
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : null;

  return createImportedWork({
    id: openLibraryWorkId(externalId),
    type: "book",
    title,
    creator,
    coverUrl,
    description: "",
    releaseDate: doc.first_publish_year
      ? String(doc.first_publish_year)
      : undefined,
    genres: doc.subject?.slice(0, 8) ?? [],
    source: OPEN_LIBRARY_SOURCE,
    externalId,
    metadata: {
      provider: OPEN_LIBRARY_SOURCE,
      coverId: doc.cover_i,
      pages: doc.number_of_pages_median,
    },
  });
}

/**
 * Named entry point for book search.
 * Mapper + config are ready; network fetch lands in the API integration task.
 */
export async function searchBooks(
  query: string,
  limit = 12,
): Promise<Work[]> {
  const trimmed = query.trim();
  if (!trimmed || limit < 1) return [];
  return [];
}

/**
 * Open Library book service — existing WorkMediaService contract.
 * searchBooks is the concrete search entry; search() delegates to it.
 */
export const bookService: BookService = {
  async list(): Promise<WorkListResult> {
    return { items: [] };
  },

  async getById(): Promise<Work | null> {
    return null;
  },

  async search(query: string, limit?: number): Promise<Work[]> {
    return searchBooks(query, limit);
  },
};
