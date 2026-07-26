import {
  DEMO_JOURNAL_ENTRIES,
  DEMO_PERSONA_FLAG_KEY,
  DEMO_PERSONA_ID,
  DEMO_USER_MEDIA_STATE,
} from "@/lib/demo/reflective-explorer-seed";

const JOURNAL_KEY = "muselog-journal-entries-v1";
const MEDIA_KEY = "muselog-user-media-state-v1";

function isEmptyJournal(raw: string | null): boolean {
  if (!raw) return true;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return !Array.isArray(parsed) || parsed.length === 0;
  } catch {
    return true;
  }
}

function isEmptyMedia(raw: string | null): boolean {
  if (!raw) return true;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return !parsed || typeof parsed !== "object" || Object.keys(parsed).length === 0;
  } catch {
    return true;
  }
}

/**
 * Seeds Reflective Explorer demo data once on a fresh browser.
 * Never overwrites existing journal or library state.
 */
export function ensureReflectiveExplorerDemoSeed(): void {
  if (typeof window === "undefined") return;

  const flag = window.localStorage.getItem(DEMO_PERSONA_FLAG_KEY);
  if (flag) return;

  const journalEmpty = isEmptyJournal(window.localStorage.getItem(JOURNAL_KEY));
  const mediaEmpty = isEmptyMedia(window.localStorage.getItem(MEDIA_KEY));

  if (!journalEmpty || !mediaEmpty) {
    window.localStorage.setItem(DEMO_PERSONA_FLAG_KEY, "skipped");
    return;
  }

  window.localStorage.setItem(
    JOURNAL_KEY,
    JSON.stringify(DEMO_JOURNAL_ENTRIES),
  );
  window.localStorage.setItem(
    MEDIA_KEY,
    JSON.stringify(DEMO_USER_MEDIA_STATE),
  );
  window.localStorage.setItem(DEMO_PERSONA_FLAG_KEY, DEMO_PERSONA_ID);

  window.dispatchEvent(new CustomEvent("muselog-journal-entries-updated"));
  window.dispatchEvent(new CustomEvent("muselog-user-media-updated"));
}
