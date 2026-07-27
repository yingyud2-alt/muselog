/**
 * Work enrichment service — cultural profile layer for Detail pages.
 *
 * Placeholder: deterministic generation from existing Work metadata.
 * Does NOT call an external AI API yet.
 */

import { workTitleIdentityKey } from "@/lib/work/work-identity";
import type { Work } from "@/types/work";
import type {
  WorkEnrichment,
  WorkEnrichmentSimilarWork,
  WorkMoodProfile,
} from "@/types/work-enrichment";

const MOOD_KEYS = [
  "quiet",
  "nostalgic",
  "melancholic",
  "hopeful",
  "intense",
] as const;

type MoodKey = (typeof MOOD_KEYS)[number];

/** Clamp to editorial 0–10 mood scale. */
function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, Math.round(value)));
}

function uniqueStrings(values: string[], limit = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    if (!value || value.length > 40) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= limit) break;
  }
  return out;
}

function hashUnit(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

function buildSummary(work: Work): string | undefined {
  const description = work.description.trim();
  if (description) {
    if (description.length <= 360) return description;
    const cut = description.slice(0, 340);
    const boundary = cut.lastIndexOf(" ");
    return `${(boundary > 200 ? cut.slice(0, boundary) : cut).trim()}…`;
  }
  if (!work.title.trim()) return undefined;
  const kind =
    work.type === "movie" ? "film" : work.type === "music" ? "album" : "book";
  return `${work.title} is a ${kind} by ${work.creator || "an unknown creator"}.`;
}

/**
 * Known cultural titles get editorial theme seeds; others derive from genres/tags.
 */
function editorialThemeSeed(titleKey: string): string[] {
  if (titleKey === "norwegian wood") {
    return ["memory", "loneliness", "coming of age"];
  }
  if (titleKey === "kafka on the shore" || titleKey === "海辺のカフカ") {
    return ["identity", "dreams", "fate"];
  }
  if (
    titleKey === "the little prince" ||
    titleKey === "le petit prince" ||
    titleKey === "little prince"
  ) {
    return ["wonder", "loneliness", "innocence"];
  }
  return [];
}

function buildThemes(work: Work): string[] | undefined {
  const titleKey = workTitleIdentityKey(work.title);
  const seeded = editorialThemeSeed(titleKey);
  const fromMeta = uniqueStrings([...work.moodTags, ...work.genres], 6);
  const themes = uniqueStrings([...seeded, ...fromMeta], 6);
  return themes.length > 0 ? themes : undefined;
}

function scoreMood(work: Work, key: MoodKey, haystack: string): number {
  // Base 2–4 from stable hash, then boost from metadata keywords.
  let score = 2 + hashUnit(`${work.id}:${key}`) * 2;

  const patterns: Record<MoodKey, RegExp> = {
    quiet: /\b(quiet|calm|gentle|soft|still|silence|literary|reflective)\b/i,
    nostalgic:
      /\b(nostalg|memory|memoir|coming of age|bittersweet|1960|tokyo)\b/i,
    melancholic: /\b(melanchol|lonel|loss|rain|sorrow|sad|grief)\b/i,
    hopeful: /\b(hope|light|warm|tender|love|wonder|innocen)\b/i,
    intense: /\b(intense|dark|surreal|mystery|thriller|brutal|violence)\b/i,
  };

  if (patterns[key].test(haystack)) score += 3.5;
  if (work.moodTags.some((tag) => patterns[key].test(tag))) score += 2;
  if (work.genres.some((genre) => patterns[key].test(genre))) score += 1.5;

  // Title-specific editorial accents (Norwegian Wood example).
  const titleKey = workTitleIdentityKey(work.title);
  if (titleKey === "norwegian wood") {
    if (key === "quiet") score = Math.max(score, 8);
    if (key === "nostalgic") score = Math.max(score, 9);
    if (key === "melancholic") score = Math.max(score, 8);
    if (key === "hopeful") score = Math.max(score, 4);
    if (key === "intense") score = Math.min(score, 5);
  }

  return clampScore(score);
}

function buildMoodProfile(work: Work): WorkMoodProfile {
  const haystack = [
    work.title,
    work.description,
    work.genres.join(" "),
    work.moodTags.join(" "),
  ].join(" ");

  return {
    quiet: scoreMood(work, "quiet", haystack),
    nostalgic: scoreMood(work, "nostalgic", haystack),
    melancholic: scoreMood(work, "melancholic", haystack),
    hopeful: scoreMood(work, "hopeful", haystack),
    intense: scoreMood(work, "intense", haystack),
  };
}

function buildCulturalContext(work: Work): string | undefined {
  const parts: string[] = [];
  if (work.releaseDate?.trim()) {
    parts.push(`First marked around ${work.releaseDate.trim()}`);
  }
  if (work.source === "open_library") {
    parts.push(
      parts.length > 0
        ? "held in the Open Library public catalog"
        : "Held in the Open Library public catalog",
    );
  } else if (work.source && work.source !== "manual") {
    const label = work.source.replace(/_/g, " ");
    parts.push(
      parts.length > 0 ? `sourced from ${label}` : `Sourced from ${label}`,
    );
  }
  if (work.creator?.trim()) {
    parts.push(
      parts.length > 0
        ? `shaped by ${work.creator.trim()}`
        : `A work shaped by ${work.creator.trim()}`,
    );
  }
  if (parts.length === 0) return undefined;
  const sentence = parts.join(", ");
  return sentence.endsWith(".") ? sentence : `${sentence}.`;
}

function buildEditorialTags(
  work: Work,
  themes: string[] | undefined,
): string[] | undefined {
  const tags = uniqueStrings(
    [
      work.type,
      ...work.moodTags.slice(0, 3),
      ...(themes?.slice(0, 3) ?? []),
      work.source === "open_library" ? "open library" : "",
    ],
    8,
  );
  return tags.length > 0 ? tags : undefined;
}

function buildSimilarWorks(work: Work): WorkEnrichmentSimilarWork[] | undefined {
  const creator = work.creator.trim() || "a kindred voice";
  const theme =
    work.genres[0]?.trim() || work.moodTags[0]?.trim() || "quiet attention";
  const titleKey = workTitleIdentityKey(work.title);

  const mocks: WorkEnrichmentSimilarWork[] =
    titleKey === "norwegian wood"
      ? [
          {
            title: "Kafka on the Shore",
            creator: creator,
            reason: "Another Murakami orbit of memory and longing.",
          },
          {
            title: "Never Let Me Go",
            creator: "Kazuo Ishiguro",
            reason: "Quiet coming-of-age marked by loss and tenderness.",
          },
        ]
      : [
          {
            title: `After ${work.title}`,
            creator,
            reason: `Shares creative orbit with ${creator}.`,
          },
          {
            title:
              work.type === "book"
                ? "A quieter shelf companion"
                : work.type === "movie"
                  ? "A neighboring frame"
                  : "A late-night listen",
            creator: "MuseLog catalog",
            reason: `Adjacent mood around “${theme}”.`,
          },
        ];

  const filtered = mocks.filter(
    (item) =>
      workTitleIdentityKey(item.title) !== workTitleIdentityKey(work.title),
  );
  return filtered.length > 0 ? filtered : undefined;
}

/**
 * Generate a WorkEnrichment profile from existing Work metadata.
 * Deterministic placeholder — no external AI calls.
 */
export function generateWorkEnrichment(work: Work): WorkEnrichment {
  const themes = buildThemes(work);
  return {
    summary: buildSummary(work),
    themes,
    moodProfile: buildMoodProfile(work),
    culturalContext: buildCulturalContext(work),
    similarWorks: buildSimilarWorks(work),
    editorialTags: buildEditorialTags(work, themes),
  };
}

/** Attach enrichment onto a Work copy without dropping API fields. */
export function withGeneratedEnrichment(work: Work): Work {
  return {
    ...work,
    enrichment: work.enrichment ?? generateWorkEnrichment(work),
  };
}
