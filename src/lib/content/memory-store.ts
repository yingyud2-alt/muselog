"use client";

import { useCallback, useSyncExternalStore } from "react";

import type { Memory, MemoryStatus } from "./types";
import {
  syncExploreMemoryRemoval,
  syncExploreMemoryToUserState,
} from "./explore-to-library-sync";

const STORAGE_KEY = "muselog-memories-v2";
const EMPTY_MEMORIES: Memory[] = [];

let cachedMemories: Memory[] = EMPTY_MEMORIES;
let cacheInitialized = false;

function readMemoriesFromStorage(): Memory[] {
  if (typeof window === "undefined") {
    return EMPTY_MEMORIES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return EMPTY_MEMORIES;
    }

    const parsed = JSON.parse(raw) as Memory[];

    return Array.isArray(parsed) && parsed.length > 0 ? parsed : EMPTY_MEMORIES;
  } catch {
    return EMPTY_MEMORIES;
  }
}

function ensureCacheInitialized(): void {
  if (cacheInitialized || typeof window === "undefined") {
    return;
  }

  cachedMemories = readMemoriesFromStorage();
  cacheInitialized = true;
}

function reloadCacheFromStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  cachedMemories = readMemoriesFromStorage();
  cacheInitialized = true;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  ensureCacheInitialized();

  const handleUpdate = () => {
    reloadCacheFromStorage();
    callback();
  };

  window.addEventListener("muselog-memories-updated", handleUpdate);

  return () => {
    window.removeEventListener("muselog-memories-updated", handleUpdate);
  };
}

function createMemoryId(contentId: string): string {
  return `memory-${contentId}`;
}

function writeMemories(memories: Memory[]): void {
  cachedMemories = memories.length > 0 ? memories : EMPTY_MEMORIES;
  cacheInitialized = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  window.dispatchEvent(new CustomEvent("muselog-memories-updated"));
}

export function getAllMemories(): Memory[] {
  ensureCacheInitialized();
  return cachedMemories;
}

export function getMemoryByContentId(contentId: string): Memory | null {
  ensureCacheInitialized();
  return cachedMemories.find((memory) => memory.contentId === contentId) ?? null;
}

export function upsertMemory(
  partial: Pick<Memory, "contentId"> &
    Partial<Omit<Memory, "contentId" | "id" | "createdAt">> & {
      status: MemoryStatus;
    },
): Memory {
  ensureCacheInitialized();

  const memories =
    cachedMemories === EMPTY_MEMORIES ? [] : [...cachedMemories];
  const existingIndex = memories.findIndex(
    (memory) => memory.contentId === partial.contentId,
  );
  const now = new Date().toISOString();

  const next: Memory = {
    id:
      existingIndex >= 0
        ? memories[existingIndex].id
        : createMemoryId(partial.contentId),
    contentId: partial.contentId,
    status: partial.status,
    rating: partial.rating,
    note: partial.note,
    mood: partial.mood,
    createdAt:
      existingIndex >= 0 ? memories[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    memories[existingIndex] = { ...memories[existingIndex], ...next };
  } else {
    memories.push(next);
  }

  writeMemories(memories);

  syncExploreMemoryToUserState(next);

  return next;
}

export function removeMemory(contentId: string): void {
  ensureCacheInitialized();

  writeMemories(
    cachedMemories.filter((memory) => memory.contentId !== contentId),
  );

  syncExploreMemoryRemoval(contentId);
}

export function useUserMemory(contentId: string) {
  const memory = useSyncExternalStore(
    subscribe,
    () => getMemoryByContentId(contentId),
    () => null,
  );

  const save = useCallback(
    (
      partial: Partial<Omit<Memory, "contentId" | "id" | "createdAt">> & {
        status: MemoryStatus;
      },
    ) => upsertMemory({ contentId, ...partial }),
    [contentId],
  );

  return { memory, save };
}

export function useAllMemories() {
  const memories = useSyncExternalStore(
    subscribe,
    getAllMemories,
    () => EMPTY_MEMORIES,
  );

  return { memories };
}
