import {
  coverCandidatesFromMetadata,
  FALLBACK_COVER,
  normalizeWorkCoverUrl,
  resolveCoverUrl,
} from "@/lib/work/cover-url";
import { normalizeExternalRatings } from "@/lib/work/work-adapters";
import type { ExternalRating, Work, WorkType } from "@/types/work";

/** MuseLog placeholder cover when an API omits artwork. */
export const IMPORTED_WORK_PLACEHOLDER_COVER = FALLBACK_COVER;

/**
 * Identity fields for an external API result.
 * Interaction fields (rating, review, journal, aiInsights) are omitted
 * until the user acts via setWorkStatus / journal flows.
 */
export type ImportedWorkInput = {
  /** Prefer provider-prefixed id, e.g. `ol-OLID:XXXX`. */
  id: string;
  type: WorkType;
  title: string;
  creator: string;
  /** Map API cover → coverUrl. Empty/missing uses placeholder. */
  coverUrl?: string | number | null;
  description?: string | null;
  releaseDate?: string | null;
  genres?: string[];
  source: string;
  externalId: string;
  /** Optional community ratings from the provider (not wired yet). */
  externalRatings?: ExternalRating[];
  metadata?: Record<string, unknown>;
};

/**
 * Central Work creation pipeline for API imports.
 * Always writes a normalized `coverUrl` so Library / Journal / Calendar
 * receive the same remote artwork as Explore.
 */
export function createImportedWork(input: ImportedWorkInput): Work {
  const coverUrl = resolveCoverUrl(
    input.coverUrl,
    ...coverCandidatesFromMetadata(input.metadata),
  );
  // Re-run with source so bare TMDB poster paths resolve correctly.
  const normalizedCover = normalizeWorkCoverUrl(coverUrl, {
    source: input.source,
  });

  const description =
    typeof input.description === "string" && input.description.trim()
      ? input.description.trim()
      : "";

  return {
    id: input.id,
    type: input.type,
    title: input.title.trim() || "Untitled",
    creator: input.creator.trim() || "Unknown",
    coverUrl: normalizedCover,
    description,
    releaseDate: input.releaseDate?.trim() || undefined,
    genres: input.genres ? [...input.genres] : [],
    // Schema default only — not persisted as user interaction.
    userStatus: "want",
    userState: "want",
    timeline: {},
    userNotes: "",
    moodTags: [],
    externalRatings: normalizeExternalRatings(input.externalRatings),
    source: input.source,
    externalId: input.externalId,
    metadata: input.metadata,
  };
}

/** Stable MuseLog id for an Open Library work/edition key. */
export function openLibraryWorkId(externalId: string): string {
  const cleaned = externalId.replace(/^\/+/, "").replace(/\//g, "-");
  return `ol-${cleaned}`;
}

/** Stable MuseLog id for a TMDB movie id. */
export function tmdbWorkId(externalId: string | number): string {
  const cleaned = String(externalId).trim().replace(/^\/+/, "");
  return `tmdb-${cleaned}`;
}

/** Stable MuseLog id for a Last.fm album / track / artist key. */
export function lastfmWorkId(kind: string, externalId: string): string {
  const cleaned = externalId
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return `lastfm-${kind}-${cleaned || "unknown"}`;
}
