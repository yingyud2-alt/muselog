"use client";

import { useSyncExternalStore } from "react";

import { getContentById } from "@/lib/content/content-data";
import { isRemoteCoverUrl } from "@/lib/work/cover-url";
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

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  cached = read();
  initialized = true;
}

function write(next: Record<string, Work>) {
  cached = next;
  initialized = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("muselog-imported-works-updated"));
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  ensureInit();
  const handler = () => {
    cached = read();
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
  // Keep a previously saved remote cover if a later search omits cover_i.
  const coverUrl =
    isRemoteCoverUrl(work.coverUrl)
      ? work.coverUrl
      : isRemoteCoverUrl(previous?.coverUrl)
        ? previous!.coverUrl
        : work.coverUrl;
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
  const next: Work = {
    ...work,
    coverUrl,
    description,
    externalRatings,
    metadata: Object.keys(metadata).length > 0 ? metadata : work.metadata,
    externalId: work.externalId ?? previous?.externalId,
    source: work.source ?? previous?.source,
  };
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
  if (cached[id]) return cached[id]!;

  const catalog = getContentById(id);
  if (!catalog) return null;
  return (
    findImportedWorkByIdentity(catalog.title, catalog.creator) ??
    findImportedWorkByTitle(catalog.title)
  );
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
  return Object.values(cached);
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
