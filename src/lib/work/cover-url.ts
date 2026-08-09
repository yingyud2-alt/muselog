const DEFAULT_COVER = "from-slate-800 via-slate-900 to-black";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
/** Open Library Cover API — by cover id (`cover_i`). */
const OPEN_LIBRARY_COVER_BASE = "https://covers.openlibrary.org/b/id";

/** True when the value is a Tailwind gradient class (placeholder). */
export function isGradientCover(cover: string | null | undefined): boolean {
  const value = cover?.trim() ?? "";
  if (!value) return false;
  return (
    value.includes("from-") ||
    value.includes("via-") ||
    value.includes("to-") ||
    value.includes("gradient")
  );
}

/** True when the value is a remote/local image URL (not a Tailwind gradient class). */
export function isRemoteCoverUrl(cover: string | null | undefined): boolean {
  const value = cover?.trim() ?? "";
  if (!value || isGradientCover(value)) return false;
  return (
    value.startsWith("https://") ||
    value.startsWith("http://") ||
    value.startsWith("//") ||
    value.startsWith("data:") ||
    // Local static assets only — not bare TMDB poster paths.
    (value.startsWith("/") && value.indexOf("/", 1) !== -1)
  );
}

function looksLikeTmdbPosterPath(value: string): boolean {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("/api/") || value.startsWith("/_next/")) return false;
  // TMDB posters are single-segment (`/abcdef.jpg`), not nested site paths.
  if (value.indexOf("/", 1) !== -1) return false;
  return /\.(jpe?g|png|webp)(\?.*)?$/i.test(value);
}

function openLibraryCoverFromId(coverId: number | string): string {
  const id =
    typeof coverId === "number"
      ? Math.floor(coverId)
      : String(coverId).trim();
  return `${OPEN_LIBRARY_COVER_BASE}/${id}-L.jpg`;
}

/**
 * Normalize provider-specific cover fields into a usable Work.coverUrl.
 *
 * Open Library: cover_i → https://covers.openlibrary.org/b/id/{cover_i}-L.jpg
 * TMDB: poster_path → https://image.tmdb.org/t/p/w500{poster_path}
 * Last.fm: //host/... → https://host/...
 * Missing / invalid → gradient placeholder
 */
export function normalizeWorkCoverUrl(
  value: string | number | null | undefined,
  options: { source?: string | null } = {},
): string {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return openLibraryCoverFromId(value);
  }

  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return DEFAULT_COVER;

  if (isGradientCover(raw)) return raw;

  // Protocol-relative (common from Last.fm).
  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }

  // Rewrite legacy / shorthand Open Library host paths to canonical /b/id/.
  const olShorthand = raw.match(
    /^https?:\/\/covers\.openlibrary\.org\/(?:b\/)?id\/(\d+)-([SML])\.jpe?g$/i,
  );
  if (olShorthand) {
    return openLibraryCoverFromId(olShorthand[1]!);
  }

  if (
    raw.startsWith("https://") ||
    raw.startsWith("http://") ||
    raw.startsWith("data:")
  ) {
    return raw;
  }

  // Bare Open Library cover id.
  if (/^\d+$/.test(raw)) {
    return openLibraryCoverFromId(raw);
  }

  const source = (options.source ?? "").toLowerCase();

  // TMDB poster_path (`/abc.jpg`) — never leave as site-relative `/abc.jpg`.
  if (source === "tmdb" || looksLikeTmdbPosterPath(raw)) {
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    if (path.includes("null") && path.length < 12) return DEFAULT_COVER;
    return `${TMDB_IMAGE_BASE}${path}`;
  }

  // Absolute site path assets (rare).
  if (raw.startsWith("/") && !looksLikeTmdbPosterPath(raw)) {
    return raw;
  }

  return DEFAULT_COVER;
}

/**
 * Pull alternate cover candidates from Work.metadata (cover_i / posterPath).
 * Used when coverUrl was saved as a placeholder before normalization.
 */
export function coverCandidatesFromMetadata(
  metadata: Record<string, unknown> | undefined,
): Array<string | number | null | undefined> {
  if (!metadata) return [];
  return [
    metadata.cover_i as string | number | undefined,
    metadata.coverId as string | number | undefined,
    metadata.posterPath as string | undefined,
    metadata.poster_path as string | undefined,
  ];
}

/**
 * Prefer a real image URL over empty strings / gradient placeholders.
 * Normalizes each candidate (OL / TMDB / Last.fm) before selection.
 */
export function resolveCoverUrl(
  ...candidates: Array<string | number | null | undefined>
): string {
  const cleaned = candidates
    .map((value) => {
      if (typeof value === "string" || typeof value === "number") {
        return normalizeWorkCoverUrl(value);
      }
      return "";
    })
    .filter(Boolean);

  const remote = cleaned.find((value) => isRemoteCoverUrl(value));
  if (remote) return remote;

  return cleaned[0] ?? DEFAULT_COVER;
}

/**
 * Ensure a Work carries a normalized remote coverUrl when possible.
 * Does not change the Work model — returns a shallow-updated Work.
 */
export function withNormalizedCoverUrl<T extends {
  coverUrl: string;
  source?: string;
  metadata?: Record<string, unknown>;
}>(work: T): T {
  const fromCover = normalizeWorkCoverUrl(work.coverUrl, {
    source: work.source,
  });
  if (isRemoteCoverUrl(fromCover)) {
    return fromCover === work.coverUrl ? work : { ...work, coverUrl: fromCover };
  }

  for (const candidate of coverCandidatesFromMetadata(work.metadata)) {
    const normalized = normalizeWorkCoverUrl(candidate, {
      source: work.source,
    });
    if (isRemoteCoverUrl(normalized)) {
      return { ...work, coverUrl: normalized };
    }
  }

  return fromCover === work.coverUrl ? work : { ...work, coverUrl: fromCover };
}

export { DEFAULT_COVER as FALLBACK_COVER };
