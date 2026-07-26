"use client";

import { useCallback, useSyncExternalStore } from "react";

import { MEDIA_TIMELINE_SEED } from "@/lib/calendar/timeline-mock";
import type { MediaTimeline, TimelineColor } from "@/types/media-timeline";

const STORAGE_KEY = "muselog-media-timelines-v1";
const EMPTY_TIMELINES: MediaTimeline[] = [];

let cachedTimelines: MediaTimeline[] = EMPTY_TIMELINES;
let cacheInitialized = false;

function readFromStorage(): MediaTimeline[] {
  if (typeof window === "undefined") {
    return EMPTY_TIMELINES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return EMPTY_TIMELINES;
    }

    const parsed = JSON.parse(raw) as MediaTimeline[];

    return Array.isArray(parsed) && parsed.length > 0 ? parsed : EMPTY_TIMELINES;
  } catch {
    return EMPTY_TIMELINES;
  }
}

function ensureCacheInitialized(): void {
  if (cacheInitialized || typeof window === "undefined") {
    return;
  }

  const stored = readFromStorage();

  if (stored.length === 0) {
    cachedTimelines = MEDIA_TIMELINE_SEED;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(MEDIA_TIMELINE_SEED));
  } else {
    cachedTimelines = stored;
  }

  cacheInitialized = true;
}

function reloadCache(): void {
  if (typeof window === "undefined") {
    return;
  }

  const stored = readFromStorage();
  cachedTimelines = stored.length > 0 ? stored : MEDIA_TIMELINE_SEED;
  cacheInitialized = true;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  ensureCacheInitialized();

  const handleUpdate = () => {
    reloadCache();
    callback();
  };

  window.addEventListener("muselog-timeline-updated", handleUpdate);

  return () => {
    window.removeEventListener("muselog-timeline-updated", handleUpdate);
  };
}

function writeTimelines(timelines: MediaTimeline[]): void {
  cachedTimelines = timelines;
  cacheInitialized = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(timelines));
  window.dispatchEvent(new CustomEvent("muselog-timeline-updated"));
}

export function getAllMediaTimelines(): MediaTimeline[] {
  ensureCacheInitialized();
  return cachedTimelines;
}

export function getTimelineByMediaId(mediaId: string): MediaTimeline | null {
  ensureCacheInitialized();
  return cachedTimelines.find((entry) => entry.mediaId === mediaId) ?? null;
}

export function upsertMediaTimeline(
  mediaId: string,
  partial: Pick<MediaTimeline, "startDate" | "endDate" | "color">,
): MediaTimeline {
  ensureCacheInitialized();

  const timelines =
    cachedTimelines === EMPTY_TIMELINES
      ? [...MEDIA_TIMELINE_SEED]
      : [...cachedTimelines];
  const index = timelines.findIndex((entry) => entry.mediaId === mediaId);

  const next: MediaTimeline = {
    mediaId,
    startDate: partial.startDate,
    endDate: partial.endDate,
    color: partial.color,
  };

  if (index >= 0) {
    timelines[index] = next;
  } else {
    timelines.push(next);
  }

  writeTimelines(timelines);

  return next;
}

export function useMediaTimelines() {
  const timelines = useSyncExternalStore(
    subscribe,
    getAllMediaTimelines,
    () => EMPTY_TIMELINES,
  );

  const saveTimeline = useCallback(
    (
      mediaId: string,
      startDate: string,
      endDate: string,
      color: TimelineColor,
    ) => upsertMediaTimeline(mediaId, { startDate, endDate, color }),
    [],
  );

  return { timelines, saveTimeline, getTimeline: getTimelineByMediaId };
}
