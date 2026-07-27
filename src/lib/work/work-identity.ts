/**
 * Canonical identity helpers for matching catalog vs imported Works.
 * Used by search dedupe — not for display strings.
 */

/** Lowercase, strip accents, trim, collapse whitespace, drop punctuation. */
export function normalizeIdentityText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Match key for books (and other works):
 * normalized title + normalized creator
 * e.g. "the little prince|antoine de saint exupery"
 */
export function workIdentityKey(title: string, creator: string): string {
  return `${normalizeIdentityText(title)}|${normalizeIdentityText(creator)}`;
}

/** Title-only key — used when creator language differs (e.g. Murakami vs 村上春樹). */
export function workTitleIdentityKey(title: string): string {
  return normalizeIdentityText(title);
}
