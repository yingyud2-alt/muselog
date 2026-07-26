"use client";

import { useSyncExternalStore } from "react";

import type { Work } from "@/types/work";

/**
 * Local catalog of imported API Works (identity only).
 * User status / rating / journal stay in their own stores until interaction.
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
  write({ ...cached, [work.id]: work });
  return work;
}

export function getImportedWorkById(id: string): Work | null {
  ensureInit();
  return cached[id] ?? null;
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
