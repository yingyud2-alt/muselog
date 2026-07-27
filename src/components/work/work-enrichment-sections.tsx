"use client";

import type { WorkEnrichment, WorkMoodProfile } from "@/types/work-enrichment";

type WorkEnrichmentSectionsProps = {
  enrichment: WorkEnrichment;
  /** Raw API description — used when enrichment.summary is absent. */
  description?: string;
  includeSimilar?: boolean;
};

const MOOD_LABELS: Array<{ key: keyof WorkMoodProfile; label: string }> = [
  { key: "quiet", label: "Quiet" },
  { key: "nostalgic", label: "Nostalgic" },
  { key: "melancholic", label: "Melancholic" },
  { key: "hopeful", label: "Hopeful" },
  { key: "intense", label: "Intense" },
];

function hasMoodProfile(profile: WorkMoodProfile | undefined): boolean {
  if (!profile) return false;
  return MOOD_LABELS.some(
    ({ key }) =>
      typeof profile[key] === "number" && Number.isFinite(profile[key]),
  );
}

function clampDisplay(value: number): number {
  return Math.max(0, Math.min(10, value));
}

/** Prefer short editorial themes over long catalog subjects. */
function compactThemes(themes: string[]): string[] {
  const short = themes.filter((theme) => theme.trim().length <= 22);
  const list = short.length > 0 ? short : themes;
  return list.slice(0, 6);
}

const sectionClass =
  "mt-20 border-t border-white/[0.05] pt-14 md:mt-28 md:pt-16";

/**
 * About → Themes → Mood — editorial archive blocks.
 */
export function WorkEnrichmentSections({
  enrichment,
  description,
  includeSimilar = false,
}: WorkEnrichmentSectionsProps) {
  const aboutText =
    enrichment.summary?.trim() || description?.trim() || "";
  const culturalContext = enrichment.culturalContext?.trim();
  const themes = compactThemes(
    enrichment.themes?.filter((theme) => theme.trim()) ?? [],
  );
  const moodProfile = enrichment.moodProfile;

  return (
    <>
      {aboutText || culturalContext ? (
        <section className={sectionClass}>
          <h2 className="font-display text-[24px] font-medium tracking-tight text-white/90 md:text-[26px]">
            About this work
          </h2>
          {aboutText ? (
            <p className="mt-8 max-w-2xl font-quote text-[17px] leading-[1.8] text-white/60 md:text-[18px]">
              {aboutText}
            </p>
          ) : null}
          {culturalContext ? (
            <p className="mt-6 max-w-xl text-[13px] leading-relaxed text-white/34">
              {culturalContext}
            </p>
          ) : null}
        </section>
      ) : null}

      {themes.length > 0 ? (
        <section className={sectionClass}>
          <h2 className="font-display text-[24px] font-medium tracking-tight text-white/90 md:text-[26px]">
            Themes
          </h2>
          <ul className="mt-8 flex flex-wrap gap-x-3 gap-y-2">
            {themes.map((theme) => (
              <li
                key={theme}
                className="text-[13px] tracking-wide text-white/48"
              >
                {theme}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hasMoodProfile(moodProfile) && moodProfile ? (
        <section className={sectionClass}>
          <h2 className="font-display text-[24px] font-medium tracking-tight text-white/90 md:text-[26px]">
            Mood profile
          </h2>
          <ul className="mt-10 max-w-md space-y-6">
            {MOOD_LABELS.map(({ key, label }) => {
              const value = moodProfile[key];
              if (typeof value !== "number" || !Number.isFinite(value)) {
                return null;
              }
              const score = clampDisplay(value);
              const percent = Math.round((score / 10) * 100);
              return (
                <li key={key}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[13px] text-white/52">{label}</span>
                    <span className="font-label text-[10px] tabular-nums tracking-[0.14em] text-white/26">
                      {score}
                    </span>
                  </div>
                  <div className="mt-2.5 h-px w-full bg-white/[0.07]">
                    <div
                      className="h-px bg-white/35"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {includeSimilar ? (
        <WorkSimilarWorksSection enrichment={enrichment} />
      ) : null}
    </>
  );
}

/** Similar works — horizontal quiet cards. */
export function WorkSimilarWorksSection({
  enrichment,
}: {
  enrichment: WorkEnrichment;
}) {
  const similar = enrichment.similarWorks ?? [];
  if (similar.length === 0) return null;

  return (
    <section className={sectionClass}>
      <h2 className="font-display text-[24px] font-medium tracking-tight text-white/90 md:text-[26px]">
        Similar works
      </h2>
      <ul className="mt-10 -mx-5 flex gap-4 overflow-x-auto px-5 pb-1 [scrollbar-width:thin] md:mx-0 md:px-0">
        {similar.map((item) => (
          <li
            key={`${item.title}-${item.creator}-${item.reason}`}
            className="w-[200px] shrink-0 border-b border-white/[0.06] pb-5 pt-1"
          >
            <p className="font-display text-[15px] leading-snug text-white/86">
              {item.title}
            </p>
            <p className="mt-2 text-[12px] text-white/38">{item.creator}</p>
            <p className="mt-3 text-[12px] leading-relaxed text-white/32">
              {item.reason}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
