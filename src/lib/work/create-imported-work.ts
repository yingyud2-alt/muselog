import { normalizeExternalRatings } from "@/lib/work/work-adapters";
import type { ExternalRating, Work, WorkType } from "@/types/work";

/** MuseLog placeholder cover when an API omits artwork. */
export const IMPORTED_WORK_PLACEHOLDER_COVER =
  "from-slate-800 via-slate-900 to-black";

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
  coverUrl?: string | null;
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
 * Build a catalog Work from an external API hit.
 * Does not write user-media / memory / journal state.
 */
function isUsableCoverUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  // Real remote / local asset — keep as Work.coverUrl.
  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:")
  ) {
    return true;
  }
  // Legacy MuseLog gradient class strings are also valid covers.
  if (
    trimmed.includes("from-") ||
    trimmed.includes("via-") ||
    trimmed.includes("to-")
  ) {
    return true;
  }
  return false;
}

export function createImportedWork(input: ImportedWorkInput): Work {
  const rawCover =
    typeof input.coverUrl === "string" ? input.coverUrl.trim() : "";
  const coverUrl = isUsableCoverUrl(rawCover)
    ? rawCover
    : IMPORTED_WORK_PLACEHOLDER_COVER;

  const description =
    typeof input.description === "string" && input.description.trim()
      ? input.description.trim()
      : "";

  return {
    id: input.id,
    type: input.type,
    title: input.title.trim() || "Untitled",
    creator: input.creator.trim() || "Unknown",
    coverUrl,
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
