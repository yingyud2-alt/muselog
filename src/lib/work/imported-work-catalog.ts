"use client";

import { useSyncExternalStore } from "react";

import { getContentById } from "@/lib/content/content-data";
import {
  isRemoteCoverUrl,
  withNormalizedCoverUrl,
} from "@/lib/work/cover-url";
import {
  normalizeIdentityText,
  workIdentityKey,
} from "@/lib/work/work-identity";
import type { Work } from "@/types/work";

/**
 * Public Content Catalog layer — API-imported Works (identity only).
 * Not user-owned until status / journal actions write User Library stores.
 *
 * Mock CONTENT_CATALOG is fallback only; resolve by id, then by
 * normalized title+creator, then by title alone when creators differ
 * across languages (Open Library often returns localized author names).
 */
const STORAGE_KEY = "muselog-imported-works-v1";
const EMPTY: Record<string, Work> = {};

let cached: Record<string, Work> = EMPTY;
let initialized = false;

function read(): Record<string, Work> {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Record<string, Work>;
    return parsed && typeof parsed === "object" ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

function hydrateRecord(record: Record<string, Work>): {
  next: Record<string, Work>;
  changed: boolean;
} {
  let changed = false;
  const next: Record<string, Work> = {};
  for (const [id, work] of Object.entries(record)) {
    if (!work || typeof work !== "object") continue;
    const hydrated = withNormalizedCoverUrl(work);
    next[id] = hydrated;
    if (hydrated.coverUrl !== work.coverUrl) changed = true;
  }
  return { next, changed };
}

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  const { next, changed } = hydrateRecord(read());
  cached = next;
  initialized = true;
  // Persist normalized coverUrl so Library / Journal / Calendar stay in sync.
  if (changed) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  }
}

function write(next: Record<string, Work>) {
  const { next: hydrated } = hydrateRecord(next);
  cached = hydrated;
  initialized = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  window.dispatchEvent(new CustomEvent("muselog-imported-works-updated"));
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  ensureInit();
  const handler = () => {
    const { next } = hydrateRecord(read());
    cached = next;
    initialized = true;
    cb();
  };
  window.addEventListener("muselog-imported-works-updated", handler);
  return () =>
    window.removeEventListener("muselog-imported-works-updated", handler);
}

/** Persist an imported catalog Work without creating user interaction state. */
export function persistImportedWork(work: Work): Work {
  ensureInit();
  const previous = cached[work.id];
  const incoming = withNormalizedCoverUrl(work);
  const previousCover = previous
    ? withNormalizedCoverUrl(previous).coverUrl
    : "";
  // Keep a previously saved remote cover if a later search omits artwork.
  const coverUrl = isRemoteCoverUrl(incoming.coverUrl)
    ? incoming.coverUrl
    : isRemoteCoverUrl(previousCover)
      ? previousCover
      : incoming.coverUrl;
  const description =
    work.description.trim() || previous?.description?.trim() || "";
  const externalRatings =
    work.externalRatings && work.externalRatings.length > 0
      ? work.externalRatings
      : previous?.externalRatings;
  const metadata = {
    ...(previous?.metadata ?? {}),
    ...(work.metadata ?? {}),
  };
  const next: Work = withNormalizedCoverUrl({
    ...work,
    coverUrl,
    description,
    externalRatings,
    metadata: Object.keys(metadata).length > 0 ? metadata : work.metadata,
    externalId: work.externalId ?? previous?.externalId,
    source: work.source ?? previous?.source,
  });
  write({ ...cached, [work.id]: next });
  return next;
}

/** Find API import by normalized title + creator (accent-insensitive). */
export function findImportedWorkByIdentity(
  title: string,
  creator: string,
): Work | null {
  ensureInit();
  const key = workIdentityKey(title, creator);
  return (
    Object.values(cached).find(
      (work) => workIdentityKey(work.title, work.creator) === key,
    ) ?? null
  );
}

/**
 * Find API import by title only.
 * Needed when Open Library creator localization differs from mock catalog
 * (e.g. "Haruki Murakami" vs "村上春樹").
 */
export function findImportedWorkByTitle(title: string): Work | null {
  ensureInit();
  const key = normalizeIdentityText(title);
  if (!key) return null;

  const matches = Object.values(cached).filter(
    (work) => normalizeIdentityText(work.title) === key,
  );
  if (matches.length === 0) return null;

  // Prefer open_library + remote cover when multiple title hits exist.
  const ranked = [...matches].sort((a, b) => {
    const score = (work: Work) => {
      let value = 0;
      if (work.source === "open_library") value += 50;
      if (isRemoteCoverUrl(work.coverUrl)) value += 40;
      if (work.description.trim()) value += 10;
      return value;
    };
    return score(b) - score(a);
  });

  return ranked[0] ?? null;
}

/**
 * Resolve public imported Work by id.
 * Falls back to identity match, then title-only match for mock catalog keys.
 */
export function getImportedWorkById(id: string): Work | null {
  ensureInit();
  if (cached[id]) return withNormalizedCoverUrl(cached[id]!);

  const catalog = getContentById(id);
  if (!catalog) return null;
  const matched =
    findImportedWorkByIdentity(catalog.title, catalog.creator) ??
    findImportedWorkByTitle(catalog.title);
  return matched ? withNormalizedCoverUrl(matched) : null;
}

/**
 * Canonical import resolver used by Explore / Journal / Calendar.
 * Order: id → title+creator → title.
 */
export function resolveImportedWork(
  workId: string,
  title?: string,
  creator?: string,
): Work | null {
  const byId = workId.trim() ? getImportedWorkById(workId.trim()) : null;
  if (byId) return byId;

  if (title?.trim() && creator?.trim()) {
    const byIdentity = findImportedWorkByIdentity(title, creator);
    if (byIdentity) return withNormalizedCoverUrl(byIdentity);
  }

  if (title?.trim()) {
    const byTitle = findImportedWorkByTitle(title);
    return byTitle ? withNormalizedCoverUrl(byTitle) : null;
  }

  return null;
}

export function getImportedWorkByExternalId(
  source: string,
  externalId: string,
): Work | null {
  ensureInit();
  return (
    Object.values(cached).find(
      (work) => work.source === source && work.externalId === externalId,
    ) ?? null
  );
}

export function listImportedWorks(): Work[] {
  ensureInit();
  return Object.values(cached).map((work) => withNormalizedCoverUrl(work));
}

export function removeImportedWork(id: string) {
  ensureInit();
  if (!cached[id]) return;
  const next = { ...cached };
  delete next[id];
  write(next);
}

export function useImportedWorkMap() {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureInit();
      return cached;
    },
    () => EMPTY,
  );
}
