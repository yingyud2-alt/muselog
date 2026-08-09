/**
 * Deterministic Work Detail copy grounded only in provider metadata.
 * No external LLM — never invents quotes, awards, or plot facts.
 */

import {
  cleanDescription,
  DESCRIPTION_FALLBACK,
} from "@/lib/work/clean-description";
import type { Work } from "@/types/work";

function yearFromRelease(releaseDate: string | undefined): string | null {
  const value = releaseDate?.trim() ?? "";
  if (!value) return null;
  const year = value.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

function genreList(work: Work, limit = 4): string[] {
  return work.genres
    .map((genre) => genre.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function metaNumber(metadata: Work["metadata"], key: string): number | null {
  const value = metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function metaString(metadata: Work["metadata"], key: string): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** About: cleaned provider description / overview, else a minimal factual line. */
export function buildAboutThisWork(work: Work): string {
  if (work.description?.trim()) {
    return cleanDescription(work.description);
  }

  const year = yearFromRelease(work.releaseDate);
  const creator = work.creator?.trim();
  const kind =
    work.type === "movie" ? "film" : work.type === "music" ? "release" : "book";

  if (creator && year) return `${work.title} is a ${year} ${kind} by ${creator}.`;
  if (creator) return `${work.title} is a ${kind} by ${creator}.`;
  if (year) return `${work.title} (${year}).`;
  return DESCRIPTION_FALLBACK;
}

/** What to expect — grounded only in known metadata fields. */
export function buildWhatToExpect(work: Work): string | undefined {
  const parts: string[] = [];
  const year = yearFromRelease(work.releaseDate);
  const genres = genreList(work);
  const pages =
    metaNumber(work.metadata, "numberOfPages") ??
    metaNumber(work.metadata, "number_of_pages") ??
    metaNumber(work.metadata, "pages");
  const runtime = metaNumber(work.metadata, "runtime");
  const director =
    metaString(work.metadata, "director") || work.creator?.trim() || null;

  if (work.type === "book") {
    if (work.creator?.trim()) parts.push(`Written by ${work.creator.trim()}`);
    if (year) parts.push(`published ${year}`);
    if (pages != null) parts.push(`${pages} pages`);
    if (genres.length > 0) parts.push(`subjects include ${genres.join(", ")}`);
  } else if (work.type === "movie") {
    if (director) parts.push(`Directed by ${director}`);
    if (year) parts.push(`released ${year}`);
    if (runtime != null) parts.push(`${runtime} minutes`);
    if (genres.length > 0) parts.push(`genres: ${genres.join(", ")}`);
  } else {
    if (work.creator?.trim()) parts.push(`By ${work.creator.trim()}`);
    if (year) parts.push(`around ${year}`);
    if (genres.length > 0) parts.push(`tagged ${genres.join(", ")}`);
    const listeners = metaNumber(work.metadata, "listeners");
    if (listeners != null) {
      parts.push(`${listeners.toLocaleString()} Last.fm listeners`);
    }
  }

  if (parts.length === 0) return undefined;
  const sentence = parts.join(" · ");
  return sentence.endsWith(".") ? sentence : `${sentence}.`;
}

/** Short guide — concise, metadata-only, never invents plot. */
export function buildShortGuide(work: Work): string | undefined {
  const genres = genreList(work, 3);
  const year = yearFromRelease(work.releaseDate);
  const rating = work.externalRatings?.[0];

  if (work.type === "book") {
    const bits = [
      genres.length > 0 ? `Start here if you enjoy ${genres.join(" / ")}` : null,
      year ? `a ${year} title` : null,
      rating
        ? `rated ${Math.round(rating.value * 10) / 10}/${rating.scale} on Open Library`
        : null,
    ].filter(Boolean);
    if (bits.length === 0) return undefined;
    return `${bits.join(" — ")}.`;
  }

  if (work.type === "movie") {
    const bits = [
      genres.length > 0 ? `A ${genres.join(" / ")} film` : "A film",
      year ? `from ${year}` : null,
      rating
        ? `TMDB ${Math.round(rating.value * 10) / 10}/${rating.scale}`
        : null,
    ].filter(Boolean);
    return `${bits.join(" · ")}. Worth watching when you want the provider genres above.`;
  }

  const listeners = metaNumber(work.metadata, "listeners");
  const bits = [
    genres.length > 0 ? `${genres.join(" / ")} listening` : "A Last.fm release",
    year ? `from ${year}` : null,
    listeners != null ? `${listeners.toLocaleString()} listeners` : null,
  ].filter(Boolean);
  if (bits.length === 0) return undefined;
  return `${bits.join(" · ")}.`;
}

export function buildProviderThemes(work: Work): string[] {
  const themes = [...work.genres, ...work.moodTags]
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value.length <= 32);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const theme of themes) {
    const key = theme.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(theme);
    if (out.length >= 8) break;
  }
  return out;
}
