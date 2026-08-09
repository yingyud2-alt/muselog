"use client";

import { removeJournalEntry } from "@/lib/calendar/journal-store";
import { closeAllDetails } from "@/lib/detail/detail-overlay-store";

const JOURNEY_STORAGE_KEY = "muselog-media-journeys-v1";

function clearJourneyOverride(entryId: string) {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(JOURNEY_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || !(entryId in parsed)) return;

    const next = { ...parsed };
    delete next[entryId];
    window.localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("muselog-journey-updated"));
  } catch {
    // Ignore corrupt journey override payloads.
  }
}

/**
 * DELETE /api/journal/[id] then remove local Journal Entry / Memory.
 * Work + Library data are left unchanged.
 */
export async function deleteJournalMemory(entryId: string): Promise<boolean> {
  const id = entryId.trim();
  if (!id) return false;

  try {
    const response = await fetch(`/api/journal/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return false;
    }
  } catch {
    return false;
  }

  removeJournalEntry(id);
  clearJourneyOverride(id);
  closeAllDetails();
  return true;
}
