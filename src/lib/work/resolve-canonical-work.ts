"use client";

import { getContentById as getCatalogById } from "@/lib/content/content-data";
import { MEDIA_EXPLORE_IDS } from "@/types/media";
import type { Work, WorkType } from "@/types/work";
import {
  FALLBACK_COVER,
  isRemoteCoverUrl,
  resolveCoverUrl,
  withNormalizedCoverUrl,
} from "@/lib/work/cover-url";
import { isApiBackedSource } from "@/lib/work/content-layers";
import {
  findImportedWorkByIdentity,
  getImportedWorkById,
  listImportedWorks,
} from "@/lib/work/imported-work-catalog";
import {
  normalizeIdentityText,
  workIdentityKey,
} from "@/lib/work/work-identity";
import { contentToWork, toWorkType } from "@/lib/work/work-adapters";

export type ResolveCanonicalWorkInput = {
  workId?: string | null;
  title?: string | null;
  creator?: string | null;
  type?: WorkType | string | null;
};

export type CanonicalWorkLog = {
  surface: string;
  storedWorkId: string;
  resolvedWorkId: string;
  source: string;
  coverUrl: string;
};

const VERIFY_TITLES = [
  "Kafka on the Shore",
  "Norwegian Wood",
  "Perfect Days",
  "Before Sunrise",
  "The Little Prince",
] as const;

/** True for provider-prefixed API Work ids. */
export function isApiWorkId(id: string | null | undefined): boolean {
  const value = id?.trim() ?? "";
  if (!value) return false;
  return /^(ol-|tmdb-|lastfm-)/i.test(value);
}

/** Legacy mock / calendar bridge ids that should map through title identity. */
export function isLegacyCatalogWorkId(id: string | null | undefined): boolean {
  const value = id?.trim() ?? "";
  if (!value || isApiWorkId(value)) return false;
  if (value.startsWith("calendar-")) return true;
  if (
    value.startsWith("book-") ||
    value.startsWith("movie-") ||
    value.startsWith("music-")
  ) {
    return true;
  }
  return Boolean(getCatalogById(value));
}

function normalizeStoredWorkId(workId: string): string {
  const trimmed = workId.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("journal-")) {
    return trimmed.replace(/^journal-/, "");
  }
  const mapped = MEDIA_EXPLORE_IDS[trimmed];
  if (mapped) return mapped;
  return trimmed;
}

function scoreApiWork(work: Work, type?: WorkType | null): number {
  let score = 0;
  if (isApiBackedSource(work.source)) score += 100;
  if (type && work.type === type) score += 50;
  if (isRemoteCoverUrl(work.coverUrl)) score += 40;
  if (work.description.trim()) score += 10;
  if (work.source === "open_library") score += 5;
  if (work.source === "tmdb") score += 5;
  if (work.source === "lastfm") score += 5;
  return score;
}

function pickBestApiWork(
  works: Work[],
  type?: WorkType | null,
): Work | null {
  if (works.length === 0) return null;
  const ranked = [...works].sort(
    (a, b) => scoreApiWork(b, type) - scoreApiWork(a, type),
  );
  const best = ranked[0];
  if (!best || !isApiBackedSource(best.source)) return null;
  return withNormalizedCoverUrl(best);
}

/** Find imported API Work by normalized title (+ optional type). */
export function findImportedApiWorkByTitle(
  title: string,
  type?: WorkType | null,
): Work | null {
  const key = normalizeIdentityText(title);
  if (!key) return null;

  const matches = listImportedWorks().filter(
    (work) =>
      isApiBackedSource(work.source) &&
      normalizeIdentityText(work.title) === key,
  );

  if (type) {
    const typed = matches.filter((work) => work.type === type);
    const bestTyped = pickBestApiWork(typed, type);
    if (bestTyped) return bestTyped;
  }

  return pickBestApiWork(matches, type);
}

function catalogHintForId(workId: string) {
  return getCatalogById(workId) ?? null;
}

/**
 * Shared canonical Work resolver for Explore / Home / Library / Journal.
 *
 * Priority:
 * 1. imported API Work (open_library / tmdb / lastfm)
 * 2. current user-library Work (caller may overlay; here = imported-or-null)
 * 3. legacy catalog item only as fallback
 */
export function resolveCanonicalWork(
  input: ResolveCanonicalWorkInput,
): Work | null {
  const rawId = input.workId?.trim() ?? "";
  const workId = rawId ? normalizeStoredWorkId(rawId) : "";
  const title = input.title?.trim() ?? "";
  const creator = input.creator?.trim() ?? "";
  const type = input.type ? toWorkType(input.type) : null;

  // 1a. Exact API id hit.
  if (workId && isApiWorkId(workId)) {
    const exact = getImportedWorkById(workId);
    if (exact && isApiBackedSource(exact.source)) {
      return withNormalizedCoverUrl(exact);
    }
  }

  // 1b. Legacy / other id → imported map (getImportedWorkById already title-falls-back for catalog ids).
  if (workId) {
    const byId = getImportedWorkById(workId);
    if (byId && isApiBackedSource(byId.source)) {
      if (!type || byId.type === type) {
        return withNormalizedCoverUrl(byId);
      }
    }
  }

  const catalog = workId ? catalogHintForId(workId) : null;
  const titleHint = title || catalog?.title || "";
  const creatorHint = creator || catalog?.creator || "";
  const typeHint = type ?? (catalog ? toWorkType(catalog.type) : null);

  // 1c. Title + creator identity (tolerates spelling; type preferred).
  if (titleHint && creatorHint) {
    const byIdentity = findImportedWorkByIdentity(titleHint, creatorHint);
    if (byIdentity && isApiBackedSource(byIdentity.source)) {
      if (!typeHint || byIdentity.type === typeHint) {
        return withNormalizedCoverUrl(byIdentity);
      }
    }
  }

  // 1d. Title (+ type) — tolerates creator translation (Murakami vs 村上春樹).
  if (titleHint) {
    const byTitle = findImportedApiWorkByTitle(titleHint, typeHint);
    if (byTitle) return byTitle;
  }

  // 1e. Broader scan: same identity key among API imports.
  if (titleHint && creatorHint) {
    const key = workIdentityKey(titleHint, creatorHint);
    const identityMatches = listImportedWorks().filter(
      (work) =>
        isApiBackedSource(work.source) &&
        workIdentityKey(work.title, work.creator) === key,
    );
    const best = pickBestApiWork(identityMatches, typeHint);
    if (best) return best;
  }

  // 3. Legacy catalog fallback (only when no API Work).
  if (catalog) {
    return contentToWork(catalog, {
      source: catalog.source,
    });
  }

  return null;
}

/**
 * Canonical id for persistence — prefers API Work id when available.
 */
export function resolveCanonicalWorkId(
  input: ResolveCanonicalWorkInput,
): string {
  const canonical = resolveCanonicalWork(input);
  if (canonical && isApiBackedSource(canonical.source)) {
    return canonical.id;
  }
  const fallback = input.workId?.trim() ?? "";
  if (fallback.startsWith("journal-")) {
    return fallback.replace(/^journal-/, "");
  }
  if (MEDIA_EXPLORE_IDS[fallback]) {
    return MEDIA_EXPLORE_IDS[fallback]!;
  }
  return fallback;
}

/**
 * Journal / Home / Library cover priority:
 * canonicalWork.coverUrl → library cover → journal snapshot → catalog gradient
 */
export function resolveCanonicalCoverUrl(input: {
  workId?: string | null;
  title?: string | null;
  creator?: string | null;
  type?: WorkType | string | null;
  libraryCover?: string | null;
  journalCover?: string | null;
  catalogCover?: string | null;
}): string {
  const canonical = resolveCanonicalWork(input);
  return resolveCoverUrl(
    canonical && isApiBackedSource(canonical.source)
      ? canonical.coverUrl
      : canonical?.coverUrl,
    input.libraryCover,
    input.journalCover,
    input.catalogCover,
    FALLBACK_COVER,
  );
}

export function toCanonicalWorkLog(
  surface: string,
  storedWorkId: string,
  input: ResolveCanonicalWorkInput,
): CanonicalWorkLog {
  const canonical = resolveCanonicalWork({
    ...input,
    workId: input.workId || storedWorkId,
  });
  return {
    surface,
    storedWorkId,
    resolvedWorkId: canonical?.id ?? storedWorkId,
    source: canonical?.source ?? "none",
    coverUrl: canonical
      ? resolveCoverUrl(canonical.coverUrl)
      : FALLBACK_COVER,
  };
}

/** Dev verification for the five shared titles across a surface. */
export function logCanonicalWorkVerification(
  surface: string,
  rows: Array<{
    storedWorkId: string;
    title: string;
    creator?: string;
    type?: string;
  }>,
) {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "production") return;

  const logs = rows
    .filter((row) =>
      VERIFY_TITLES.some(
        (title) => normalizeIdentityText(title) === normalizeIdentityText(row.title),
      ),
    )
    .map((row) =>
      toCanonicalWorkLog(surface, row.storedWorkId, {
        workId: row.storedWorkId,
        title: row.title,
        creator: row.creator,
        type: row.type,
      }),
    );

  if (logs.length === 0) return;
  // eslint-disable-next-line no-console
  console.info(`[canonical-work:${surface}]`, logs);
}

export { VERIFY_TITLES };
