"use client";

import { cleanDescription } from "@/lib/work/clean-description";
import type { WorkEnrichment } from "@/types/work-enrichment";

type WorkEnrichmentSectionsProps = {
  enrichment: WorkEnrichment;
  /** Raw API description — used when enrichment.summary is absent. */
  description?: string;
  includeSimilar?: boolean;
};

/** Prefer short provider themes over long catalog subjects. */
function compactThemes(themes: string[]): string[] {
  const short = themes.filter((theme) => theme.trim().length <= 32);
  const list = short.length > 0 ? short : themes;
  return list.slice(0, 8);
}

const sectionClass =
  "mt-20 border-t border-white/[0.05] pt-14 md:mt-28 md:pt-16";

/**
 * About → What to expect → Themes → Short guide
 * Grounded in provider metadata only.
 */
export function WorkEnrichmentSections({
  enrichment,
  description,
}: WorkEnrichmentSectionsProps) {
  const aboutText = cleanDescription(
    enrichment.summary || description,
  );
  const whatToExpect = enrichment.whatToExpect?.trim();
  const guide = enrichment.guide?.trim();
  const culturalContext = enrichment.culturalContext?.trim();
  const themes = compactThemes(
    enrichment.themes?.filter((theme) => theme.trim()) ?? [],
  );

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

      {whatToExpect ? (
        <section className={sectionClass}>
          <h2 className="font-display text-[24px] font-medium tracking-tight text-white/90 md:text-[26px]">
            What to expect
          </h2>
          <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-white/52">
            {whatToExpect}
          </p>
        </section>
      ) : null}

      {themes.length > 0 ? (
        <section className={sectionClass}>
          <h2 className="font-display text-[24px] font-medium tracking-tight text-white/90 md:text-[26px]">
            Themes / genres
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

      {guide ? (
        <section className={sectionClass}>
          <h2 className="font-display text-[24px] font-medium tracking-tight text-white/90 md:text-[26px]">
            A short guide
          </h2>
          <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-white/52">
            {guide}
          </p>
        </section>
      ) : null}
    </>
  );
}

/** Similar works — only when enrichment supplies catalog-backed entries. */
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
