"use client";

import { CONTENT_CATALOG } from "@/lib/content/content-data";
import { normalizeTitle } from "@/lib/import/normalize-media";

const EXTERNAL_ID_KEY = "muselog-import-external-ids-v1";

type ExternalIdMap = Record<string, string>;

function readExternalIds(): ExternalIdMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(EXTERNAL_ID_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ExternalIdMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function registerExternalId(externalId: string, mediaKey: string) {
  if (typeof window === "undefined") return;
  const map = readExternalIds();
  map[externalId.trim()] = mediaKey;
  window.localStorage.setItem(EXTERNAL_ID_KEY, JSON.stringify(map));
}

export function resolveMediaKeyByExternalId(externalId: string): string | null {
  const map = readExternalIds();
  return map[externalId.trim()] ?? null;
}

export function findCatalogMediaKey(
  title: string,
  creator: string,
  type: "BOOK" | "MOVIE" | "MUSIC",
): string | null {
  const normalizedTitle = normalizeTitle(title);
  const normalizedCreator = normalizeTitle(creator);

  const match = CONTENT_CATALOG.find((entry) => {
    if (entry.type !== type) return false;
    return (
      normalizeTitle(entry.title) === normalizedTitle &&
      normalizeTitle(entry.creator) === normalizedCreator
    );
  });

  return match?.id ?? null;
}

export function resolveImportMediaKey(input: {
  title: string;
  creator?: string;
  type: "BOOK" | "MOVIE" | "MUSIC";
  externalId?: string;
}): string {
  if (input.externalId) {
    const existing = resolveMediaKeyByExternalId(input.externalId);
    if (existing) return existing;
  }

  const catalogMatch = findCatalogMediaKey(
    input.title,
    input.creator ?? "",
    input.type,
  );
  if (catalogMatch) return catalogMatch;

  const hash = normalizeTitle(
    `${input.type}|${input.title}|${input.creator ?? ""}`,
  );
  return `import-${hash.slice(0, 48) || "unknown"}`;
}
