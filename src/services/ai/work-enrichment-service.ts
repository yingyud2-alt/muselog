/**
 * Work enrichment service — provider-grounded Detail profile.
 *
 * Priority:
 * 1. Provider API description / overview
 * 2. Provider genres, tags, ratings, runtime/pages
 * 3. Deterministic concise guide from known metadata only
 * 4. Placeholder when everything else is unavailable
 *
 * Does NOT call an external LLM. Does not invent quotes, awards, or plot.
 */

import {
  buildAboutThisWork,
  buildProviderThemes,
  buildShortGuide,
  buildWhatToExpect,
} from "@/lib/work/provider-detail-guide";
import type { Work } from "@/types/work";
import type { WorkEnrichment } from "@/types/work-enrichment";

function buildCulturalContext(work: Work): string | undefined {
  const parts: string[] = [];
  if (work.releaseDate?.trim()) {
    parts.push(`Released ${work.releaseDate.trim()}`);
  }
  if (work.source === "open_library") {
    parts.push("Open Library catalog");
  } else if (work.source === "tmdb") {
    parts.push("TMDB catalog");
  } else if (work.source === "lastfm") {
    parts.push("Last.fm catalog");
  }
  if (work.creator?.trim()) {
    parts.push(work.creator.trim());
  }
  if (parts.length === 0) return undefined;
  return parts.join(" · ");
}

/**
 * Generate a WorkEnrichment profile from existing Work metadata.
 * Deterministic — no external AI calls, no invented similar works / mood scores.
 */
export function generateWorkEnrichment(work: Work): WorkEnrichment {
  const themes = buildProviderThemes(work);
  return {
    summary: buildAboutThisWork(work),
    whatToExpect: buildWhatToExpect(work),
    guide: buildShortGuide(work),
    themes: themes.length > 0 ? themes : undefined,
    culturalContext: buildCulturalContext(work),
  };
}

/** Attach enrichment onto a Work copy without dropping API fields. */
export function withGeneratedEnrichment(work: Work): Work {
  return {
    ...work,
    enrichment: work.enrichment ?? generateWorkEnrichment(work),
  };
}
