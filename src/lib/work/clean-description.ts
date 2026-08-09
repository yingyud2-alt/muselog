/**
 * Shared display cleaning for API Work descriptions.
 * Used by Explore, Home, Journal, Detail Modal, and Work Detail.
 */

export const DESCRIPTION_FALLBACK = "No description available.";
const DESCRIPTION_MAX_CHARS = 320;

/** Markers that start promotional / metadata tails — drop from here onward. */
const PROMO_CUT_PATTERNS: RegExp[] = [
  /\bWARNING\s*:/i,
  /\bContains\b/i,
  /\bRecommended for\b/i,
  /\bSource\s*:/i,
  /\bGoodreads\b/i,
  /\bAmazon\b/i,
  /\bPDF\b/,
  /\bRead more\b/i,
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripMarkdownAndUrls(value: string): string {
  let text = value;

  // [label](https://...) → label
  text = text.replace(/\[([^\]]*?)\]\(\s*https?:\/\/[^)]+\)/gi, "$1");
  // Bare markdown emphasis refs like [*Twisted Love pdf*]
  text = text.replace(/\[\*[^\]]*?\]/g, " ");
  // Remaining markdown links without usable label
  text = text.replace(/\[([^\]]*?)\]\([^)]*\)/g, "$1");
  // Parenthetical URL wrappers
  text = text.replace(/\(\s*https?:\/\/[^)]+\)/gi, " ");
  // Raw URLs
  text = text.replace(/https?:\/\/\S+/gi, " ");
  // www. links without scheme
  text = text.replace(/\bwww\.\S+/gi, " ");

  return text;
}

function stripPromoTail(value: string): string {
  let cutAt = value.length;

  for (const pattern of PROMO_CUT_PATTERNS) {
    const match = pattern.exec(value);
    if (match && typeof match.index === "number" && match.index < cutAt) {
      cutAt = match.index;
    }
  }

  return value.slice(0, cutAt).trim();
}

/**
 * Keep text up to ~320 chars, ending on the nearest prior sentence boundary.
 * Never slices through the middle of a sentence when a `.` `!` or `?` exists.
 */
function truncateAtSentence(value: string, max = DESCRIPTION_MAX_CHARS): string {
  if (value.length <= max) return value;

  const window = value.slice(0, max + 1);
  const enders = [".", "!", "?"];
  let best = -1;

  for (let i = 0; i < Math.min(window.length, max); i += 1) {
    const ch = window[i];
    if (!enders.includes(ch)) continue;
    // Prefer real sentence ends (space / end / quote after punctuation).
    const next = window[i + 1];
    if (next === undefined || /\s|"|'|”|’|\)|\]/.test(next)) {
      best = i;
    }
  }

  if (best >= 0) {
    return value.slice(0, best + 1).trim();
  }

  // First sentence is longer than max — keep the full first sentence.
  const later = value.slice(max);
  const match = later.match(/[.!?]/);
  if (match && typeof match.index === "number") {
    return value.slice(0, max + match.index + 1).trim();
  }

  // No sentence punctuation at all — last word boundary before max.
  const soft = value.slice(0, max);
  const space = soft.lastIndexOf(" ");
  const clipped = (space > 80 ? soft.slice(0, space) : soft).trim();
  return clipped;
}

/**
 * Clean an API description for display.
 * Returns "No description available." when nothing usable remains.
 */
export function cleanDescription(
  raw: string | null | undefined,
): string {
  if (typeof raw !== "string" || !raw.trim()) {
    return DESCRIPTION_FALLBACK;
  }

  let text = normalizeWhitespace(raw);
  text = stripMarkdownAndUrls(text);
  text = normalizeWhitespace(text);
  text = stripPromoTail(text);
  text = normalizeWhitespace(text);
  // Drop leftover empty parentheses / brackets from stripping.
  text = text
    .replace(/\(\s*\)/g, " ")
    .replace(/\[\s*\]/g, " ")
    .replace(/\s+([,;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return DESCRIPTION_FALLBACK;

  text = truncateAtSentence(text, DESCRIPTION_MAX_CHARS);
  text = normalizeWhitespace(text);

  return text || DESCRIPTION_FALLBACK;
}
