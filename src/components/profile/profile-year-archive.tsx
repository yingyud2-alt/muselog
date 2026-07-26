"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp } from "lucide-react";

import { ARCHIVE } from "@/components/profile/profile-archive-palette";
import { ProfileKeywordCircles } from "@/components/profile/profile-keyword-circles";
import type {
  MuseTasteTimelineYear,
  MuseYearReflection,
} from "@/lib/profile/muse-profile-data";
import { cn } from "@/lib/utils";

const EXPAND_TRANSITION = {
  duration: 0.48,
  ease: [0.22, 1, 0.36, 1] as const,
};

type ProfileYearArchiveProps = {
  reflection: MuseYearReflection;
  tasteTimeline: MuseTasteTimelineYear[];
  className?: string;
};

export function ProfileYearArchive({
  reflection,
  tasteTimeline,
  className,
}: ProfileYearArchiveProps) {
  const years = useMemo(() => {
    const fromTimeline = tasteTimeline.map((point) => point.year);
    const set = new Set([reflection.year, ...fromTimeline]);
    return [...set].sort((a, b) => b - a);
  }, [reflection.year, tasteTimeline]);

  const [selectedYear, setSelectedYear] = useState(reflection.year);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const sectionRef = useRef<HTMLElement>(null);

  const selectedPoint =
    tasteTimeline.find((point) => point.year === selectedYear) ?? null;

  const previewKeywords =
    selectedPoint?.keywords.slice(0, 3) ?? reflection.themes.slice(0, 3);

  const yearlySummary =
    selectedYear === reflection.year
      ? reflection.previewSummary
      : selectedPoint?.note ?? reflection.previewSummary;

  const aiSummary =
    selectedYear === reflection.year
      ? reflection.aiSummary
      : selectedPoint
        ? `${selectedPoint.personaName}: ${selectedPoint.note}`
        : reflection.aiSummary;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#year-archive") return;

    const timer = window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const collapseYear = () => {
    setOpen(false);
    requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <section
      ref={sectionRef}
      id="year-archive"
      className={cn(
        "scroll-mt-28 rounded-[24px] border px-5 py-6 md:px-7 md:py-7",
        className,
      )}
      style={{
        backgroundColor: ARCHIVE.navy,
        borderColor: ARCHIVE.border,
      }}
      aria-label="Year Cultural Archive"
    >
      <p
        className="font-label text-[10px] uppercase tracking-[0.18em]"
        style={{ color: ARCHIVE.mist }}
      >
        Year Cultural Archive
      </p>

      <div
        className="mt-5 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Archive years"
      >
        {years.map((year) => {
          const active = selectedYear === year;
          return (
            <button
              key={year}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setSelectedYear(year);
                setOpen(false);
              }}
              className="rounded-full border px-3.5 py-1.5 font-display text-[13px] font-bold transition-colors"
              style={{
                borderColor: ARCHIVE.border,
                backgroundColor: active ? ARCHIVE.steel : ARCHIVE.navyElevated,
                color: active ? ARCHIVE.ink : ARCHIVE.mist,
              }}
            >
              {year}
            </button>
          );
        })}
      </div>

      <h2 className="font-hero mt-5 text-[22px] font-medium tracking-tight text-white/90 md:text-[26px]">
        {selectedYear} Cultural Archive
      </h2>

      <p className="font-body mt-3 text-[15px] leading-relaxed text-white/58">
        {yearlySummary}
      </p>

      {selectedYear === reflection.year ? (
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-white/48">
          <li>{reflection.totalMemories} memories</li>
          <li>{reflection.books} books</li>
          <li>{reflection.movies} movies</li>
          <li>{reflection.music} music</li>
        </ul>
      ) : null}

      <p className="font-label mt-5 text-[10px] uppercase tracking-[0.16em] text-white/32">
        Yearly keywords
      </p>
      <ProfileKeywordCircles
        keywords={previewKeywords}
        className="mt-3 justify-start"
        compact
      />

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          aria-controls={panelId}
          className={cn(
            "mt-5 inline-flex items-center font-display text-[13px] font-bold",
            "text-white/68 transition-colors hover:text-white/92",
          )}
        >
          Explore {selectedYear} Archive →
        </button>
      ) : null}

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            key={`year-${selectedYear}-body`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={EXPAND_TRANSITION}
            className="overflow-hidden"
          >
            <div className="mt-6 space-y-8 border-t border-white/[0.06] pt-6">
              <div>
                <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/32">
                  Yearly summary
                </p>
                <p className="font-body mt-2 text-[15px] leading-relaxed text-white/62">
                  {yearlySummary}
                </p>
              </div>

              <div>
                <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/32">
                  Yearly keywords
                </p>
                <ProfileKeywordCircles
                  keywords={
                    selectedPoint?.keywords ?? reflection.themes
                  }
                  className="mt-3 justify-start"
                  compact
                />
              </div>

              {selectedYear === reflection.year ? (
                <div>
                  <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/32">
                    Important works
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {reflection.genres.map((genre) => (
                      <li
                        key={genre}
                        className="rounded-full border px-3 py-1 font-label text-[11px]"
                        style={{
                          borderColor: ARCHIVE.border,
                          backgroundColor: ARCHIVE.navyElevated,
                          color: ARCHIVE.mist,
                        }}
                      >
                        ○ {genre}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : selectedPoint ? (
                <div>
                  <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/32">
                    Identity note
                  </p>
                  <p className="font-display mt-2 text-[15px] font-bold text-white/85">
                    {selectedPoint.personaName}
                  </p>
                  <p className="font-body mt-1.5 text-[14px] leading-relaxed text-white/52">
                    {selectedPoint.note}
                  </p>
                </div>
              ) : null}

              <div>
                <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/32">
                  AI cultural reflection
                </p>
                <p className="font-body mt-2 max-w-xl text-[15px] leading-relaxed text-white/62">
                  {aiSummary}
                </p>
              </div>

              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={collapseYear}
                  aria-label="Collapse year archive"
                  className="group inline-flex flex-col items-center gap-1.5"
                >
                  <span
                    className="inline-flex size-8 items-center justify-center rounded-full border transition-colors"
                    style={{
                      borderColor: ARCHIVE.border,
                      backgroundColor: ARCHIVE.navyElevated,
                      color: ARCHIVE.mist,
                    }}
                  >
                    <ChevronUp className="size-3.5" aria-hidden="true" />
                  </span>
                  <span
                    className="font-label text-[10px] uppercase tracking-[0.14em]"
                    style={{ color: ARCHIVE.sage }}
                  >
                    Collapse
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
