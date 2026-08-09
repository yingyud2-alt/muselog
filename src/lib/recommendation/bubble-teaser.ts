/**
 * Concise editorial teaser for featured Mood Bubbles.
 * Grounded only in provider metadata — never presented as a sourced quotation.
 */

import {
  cleanDescription,
  DESCRIPTION_FALLBACK,
} from "@/lib/work/clean-description";
import {
  buildAboutThisWork,
  buildShortGuide,
  buildWhatToExpect,
} from "@/lib/work/provider-detail-guide";
import type { Work } from "@/types/work";

function stripWrappingQuotes(text: string): string {
  return text.replace(/^["'“”‘’]+|["'“”‘’]+$/g, "").trim();
}

function firstClause(text: string, max = 72): string {
  const cleaned = stripWrappingQuotes(text.replace(/\s+/g, " "));
  if (!cleaned) return "";
  const sentence = cleaned.match(/^(.+?[.!?])(\s|$)/)?.[1] ?? cleaned;
  if (sentence.length <= max) return sentence.replace(/[.!?]$/, "").trim();
  const cut = sentence.slice(0, max - 1);
  const boundary = cut.lastIndexOf(" ");
  return (boundary > 28 ? cut.slice(0, boundary) : cut).trim();
}

/**
 * Text priority:
 * 1. short provider description excerpt
 * 2. metadata-derived guide / what-to-expect
 * 3. title + creator
 */
export function buildBubbleTeaser(work: Work): string {
  const cleaned = cleanDescription(work.description);
  if (cleaned !== DESCRIPTION_FALLBACK) {
    const fromDescription = firstClause(cleaned);
    if (fromDescription) return fromDescription;
  }

  const expect = buildWhatToExpect(work);
  if (expect) return firstClause(expect, 68);

  const guide = buildShortGuide(work);
  if (guide) return firstClause(guide, 68);

  const about = buildAboutThisWork(work);
  if (about && about !== work.title.trim()) {
    return firstClause(about, 68);
  }

  const creator = work.creator?.trim();
  if (creator) return `${work.title} · ${creator}`;
  return work.title.trim() || "Untitled";
}
