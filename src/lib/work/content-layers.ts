/**
 * MuseLog content architecture — two layers.
 *
 * A. Public Content Catalog (discovery / search only)
 *    - API imports: Open Library / TMDB / Last.fm
 *    - Live surfaces accept only displayable API Works
 *      (`isDisplayableApiWork` in displayable-api-work.ts)
 *    - Mock CONTENT_CATALOG is a development empty-state fallback only
 *    Fields: title, creator, coverUrl, description, releaseDate,
 *            genres, externalId, source
 *    Users do NOT own these until they act.
 *
 * B. User Library (personal relationship)
 *    - user-media-state, memories, journal
 *    Fields: workId, status, rating, review, journal, timeline
 *    Created only after: Add to Library / Want / Finished / Journal
 *
 * Priority when resolving public identity:
 *    1. API imported Work (real coverUrl)
 *    2. Dev-only mock CONTENT_CATALOG (never on production live surfaces)
 */

export const CONTENT_LAYER = {
  publicCatalog: "public_catalog",
  userLibrary: "user_library",
} as const;

export type ContentLayer = (typeof CONTENT_LAYER)[keyof typeof CONTENT_LAYER];

/** True when Work came from an external API import (not mock catalog). */
export function isApiBackedSource(source: string | undefined | null): boolean {
  if (!source) return false;
  const value = source.trim().toLowerCase();
  return (
    value === "open_library" ||
    value === "tmdb" ||
    value === "lastfm" ||
    value === "spotify" ||
    value === "musicbrainz"
  );
}

/** Production display providers (stricter than isApiBackedSource). */
export function isProductionApiSource(
  source: string | undefined | null,
): boolean {
  if (!source) return false;
  const value = source.trim().toLowerCase();
  return (
    value === "open_library" || value === "tmdb" || value === "lastfm"
  );
}
