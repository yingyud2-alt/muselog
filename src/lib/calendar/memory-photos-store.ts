"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "muselog-memory-photos-v1";

type PhotoRecord = Record<string, string[]>;

const EMPTY_RECORD: PhotoRecord = {};

let cachedRecord: PhotoRecord = EMPTY_RECORD;
let cacheInitialized = false;

function readRecord(): PhotoRecord {
  if (typeof window === "undefined") {
    return EMPTY_RECORD;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return EMPTY_RECORD;
    }

    const parsed = JSON.parse(raw) as PhotoRecord;

    return parsed && typeof parsed === "object" ? parsed : EMPTY_RECORD;
  } catch {
    return EMPTY_RECORD;
  }
}

function ensureCacheInitialized(): void {
  if (cacheInitialized || typeof window === "undefined") {
    return;
  }

  cachedRecord = readRecord();
  cacheInitialized = true;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  ensureCacheInitialized();

  const handleUpdate = () => {
    cachedRecord = readRecord();
    cacheInitialized = true;
    callback();
  };

  window.addEventListener("muselog-memory-photos-updated", handleUpdate);

  return () => {
    window.removeEventListener("muselog-memory-photos-updated", handleUpdate);
  };
}

function getSnapshot(): PhotoRecord {
  ensureCacheInitialized();
  return cachedRecord;
}

function writeRecord(record: PhotoRecord): void {
  cachedRecord = record;
  cacheInitialized = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new CustomEvent("muselog-memory-photos-updated"));
}

export function useMemoryPhotos(mediaId: string | null) {
  const record = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_RECORD);
  const photos = mediaId ? (record[mediaId] ?? []) : [];

  const addPhoto = useCallback(
    (photoUrl: string) => {
      if (!mediaId) {
        return;
      }

      ensureCacheInitialized();
      const existing = cachedRecord[mediaId] ?? [];

      writeRecord({
        ...cachedRecord,
        [mediaId]: [...existing, photoUrl],
      });
    },
    [mediaId],
  );

  return { photos, addPhoto };
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Failed to read file"));
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
