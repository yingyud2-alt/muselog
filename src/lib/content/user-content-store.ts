"use client";

import { useSyncExternalStore } from "react";

import type { ContentType } from "@/lib/content/types";

export type UserContentItem = {
  id: string;
  type: ContentType;
  title: string;
  creator: string;
  cover: string;
  description: string;
  tags: string[];
  source: "import" | "manual";
  externalId?: string;
};

const STORAGE_KEY = "muselog-user-content-v1";
const EMPTY: Record<string, UserContentItem> = {};

let cached: Record<string, UserContentItem> = EMPTY;
let initialized = false;

function read(): Record<string, UserContentItem> {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Record<string, UserContentItem>;
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

function write(next: Record<string, UserContentItem>) {
  cached = next;
  initialized = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("muselog-user-content-updated"));
  } catch {
    throw new Error("STORAGE_QUOTA_EXCEEDED");
  }
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  ensureInit();
  const handler = () => {
    cached = read();
    initialized = true;
    cb();
  };
  window.addEventListener("muselog-user-content-updated", handler);
  return () =>
    window.removeEventListener("muselog-user-content-updated", handler);
}

export function getUserContentById(id: string): UserContentItem | null {
  ensureInit();
  return cached[id] ?? null;
}

export function getAllUserContent(): UserContentItem[] {
  ensureInit();
  return Object.values(cached);
}

export function upsertUserContent(item: UserContentItem): void {
  ensureInit();
  write({ ...cached, [item.id]: item });
}

export function removeUserContent(id: string): void {
  ensureInit();
  if (!cached[id]) return;
  const next = { ...cached };
  delete next[id];
  write(next);
}

export function useUserContentMap() {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureInit();
      return cached;
    },
    () => EMPTY,
  );
}

export function snapshotUserContent(): Record<string, UserContentItem> {
  ensureInit();
  return { ...cached };
}

export function restoreUserContent(snapshot: Record<string, UserContentItem>) {
  write(snapshot);
}
