"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";

import { ARCHIVE } from "@/components/profile/profile-archive-palette";
import { ProfileKeywordCircles } from "@/components/profile/profile-keyword-circles";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import { useMuseProfile } from "@/lib/profile/use-muse-profile";
import { cn } from "@/lib/utils";

const EXPAND_TRANSITION = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1] as const,
};

const MONTH_STORAGE_KEY = "muselog-profile-month";

type ProfileMonthlyReflectionProps = {
  className?: string;
};

function scrollToMonthlyReportsTop(anchor: HTMLElement | null) {
  anchor?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Profile Monthly Reports — one month at a time, full archive expands here.
 */
export function ProfileMonthlyReflection({
  className,
}: ProfileMonthlyReflectionProps) {
  const { profile, goPrevMonth, goNextMonth, setMonth, adjacent } =
    useMuseProfile();
  const reflection = profile.monthlyReflection;
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.sessionStorage.getItem(MONTH_STORAGE_KEY);
    const fromHash = window.location.hash === "#monthly-reports";
    if (!stored && !fromHash) return;

    if (stored) {
      window.sessionStorage.removeItem(MONTH_STORAGE_KEY);
      const [year, month] = stored.split("-").map(Number);
      if (year && month) setMonth(year, month);
    }

    // Scroll to the Monthly Reports header first (not expanded bottom).
    const scrollTimer = window.setTimeout(() => {
      scrollToMonthlyReportsTop(titleRef.current ?? sectionRef.current);
    }, 80);

    const expandTimer = window.setTimeout(() => {
      setOpen(true);
      scrollToMonthlyReportsTop(titleRef.current ?? sectionRef.current);
    }, 420);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(expandTimer);
    };
  }, [setMonth]);

  return (
    <section
      ref={sectionRef}
      id="monthly-reports"
      className={cn(
        "scroll-mt-28 rounded-[24px] border px-5 py-6 md:px-7 md:py-7",
        className,
      )}
      style={{
        backgroundColor: ARCHIVE.navy,
        borderColor: ARCHIVE.border,
      }}
      aria-label="Monthly Reports"
    >
      <p
        ref={titleRef}
        id="monthly-reports-title"
        className="scroll-mt-28 font-label text-[10px] uppercase tracking-[0.18em]"
        style={{ color: ARCHIVE.mist }}
      >
        Monthly Reports
      </p>

      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={goPrevMonth}
          aria-label={`Previous month, ${adjacent.prevLabel}`}
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-full border",
            "transition-colors",
          )}
          style={{
            borderColor: ARCHIVE.border,
            color: ARCHIVE.mist,
            backgroundColor: ARCHIVE.navyElevated,
          }}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <h2 className="min-w-[9.5rem] text-center font-hero text-[20px] font-medium tracking-tight text-white/90 md:text-[22px]">
          {reflection.label}
        </h2>
        <button
          type="button"
          onClick={goNextMonth}
          aria-label={`Next month, ${adjacent.nextLabel}`}
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-full border",
            "transition-colors",
          )}
          style={{
            borderColor: ARCHIVE.border,
            color: ARCHIVE.mist,
            backgroundColor: ARCHIVE.navyElevated,
          }}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mx-auto mt-6 max-w-xl">
        <p
          className="font-label text-[10px] uppercase tracking-[0.16em]"
          style={{ color: ARCHIVE.steel }}
        >
          {reflection.label.split(" ")[0]} Reflection
        </p>
        <p className="font-body mt-2 text-[15px] leading-relaxed text-white/60">
          {reflection.previewSummary}
        </p>

        <p
          className="font-label mt-5 text-[10px] uppercase tracking-[0.16em]"
          style={{ color: ARCHIVE.steel }}
        >
          Keywords
        </p>
        <ProfileKeywordCircles
          keywords={reflection.moodKeywords.slice(0, 3)}
          className="mt-3 justify-start"
          compact
        />

        <p
          className="font-label mt-5 text-[10px] uppercase tracking-[0.16em]"
          style={{ color: ARCHIVE.steel }}
        >
          Highlights
        </p>
        <ul className="mt-2 space-y-1.5">
          {reflection.importantWorks.slice(0, 3).map((work) => (
            <li
              key={`${work.title}-${work.creator}`}
              className="font-display text-[14px] text-white/78"
            >
              {work.title}
              <span
                className="ml-2 font-label text-[10px] uppercase tracking-[0.1em]"
                style={{ color: ARCHIVE.sage }}
              >
                {CONTENT_TYPE_LABELS[work.type]}
              </span>
            </li>
          ))}
        </ul>

        <p
          className="font-label mt-5 text-[10px] uppercase tracking-[0.16em]"
          style={{ color: ARCHIVE.steel }}
        >
          AI monthly report
        </p>
        <p className="font-body mt-2 line-clamp-3 text-[14px] leading-relaxed text-white/55">
          {reflection.aiReflection}
        </p>

        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={false}
            aria-controls={panelId}
            className="mt-5 inline-flex items-center font-display text-[13px] font-bold transition-colors"
            style={{ color: ARCHIVE.mist }}
          >
            Expand monthly archive →
          </button>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            key={`${reflection.year}-${reflection.month}-archive`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={EXPAND_TRANSITION}
            className="overflow-hidden"
          >
            <div
              className="mx-auto mt-6 max-w-xl space-y-7 border-t pt-6"
              style={{ borderColor: ARCHIVE.border }}
            >
              <div>
                <p
                  className="font-label text-[10px] uppercase tracking-[0.16em]"
                  style={{ color: ARCHIVE.steel }}
                >
                  1. Monthly summary
                </p>
                <p className="font-body mt-2 text-[15px] leading-relaxed text-white/62">
                  {reflection.previewSummary}
                </p>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-white/45">
                  <li>{reflection.journey.books} books</li>
                  <li>{reflection.journey.movies} movies</li>
                  <li>{reflection.journey.musicHours} music hours</li>
                </ul>
              </div>

              <div>
                <p
                  className="font-label text-[10px] uppercase tracking-[0.16em]"
                  style={{ color: ARCHIVE.steel }}
                >
                  2. AI reflection
                </p>
                <p className="font-body mt-2 text-[15px] leading-relaxed text-white/62">
                  {reflection.aiReflection}
                </p>
              </div>

              <div>
                <p
                  className="font-label text-[10px] uppercase tracking-[0.16em]"
                  style={{ color: ARCHIVE.steel }}
                >
                  3. Taste keywords
                </p>
                <ProfileKeywordCircles
                  keywords={reflection.moodKeywords}
                  className="mt-3 justify-start"
                  compact
                />
              </div>

              <div>
                <p
                  className="font-label text-[10px] uppercase tracking-[0.16em]"
                  style={{ color: ARCHIVE.steel }}
                >
                  4. Important works
                </p>
                <ul className="mt-3 space-y-2">
                  {reflection.importantWorks.map((work) => (
                    <li
                      key={`${work.title}-${work.creator}`}
                      className="rounded-xl border px-3.5 py-2.5"
                      style={{
                        backgroundColor: ARCHIVE.navyElevated,
                        borderColor: ARCHIVE.border,
                      }}
                    >
                      <p className="font-display text-[14px] font-bold text-white/88">
                        {work.title}
                      </p>
                      <p
                        className="font-label mt-0.5 text-[11px]"
                        style={{ color: ARCHIVE.sage }}
                      >
                        {work.creator} · {CONTENT_TYPE_LABELS[work.type]}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p
                  className="font-label text-[10px] uppercase tracking-[0.16em]"
                  style={{ color: ARCHIVE.steel }}
                >
                  5. Personal patterns
                </p>
                <ul className="mt-3 space-y-2">
                  {reflection.personalPatterns.map((pattern) => (
                    <li
                      key={pattern}
                      className="font-body text-[14px] leading-relaxed text-white/55"
                    >
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p
                  className="font-label text-[10px] uppercase tracking-[0.16em]"
                  style={{ color: ARCHIVE.steel }}
                >
                  6. Recommendations
                </p>
                <ul className="mt-3 space-y-2">
                  {reflection.recommendations.map((item) => (
                    <li
                      key={item}
                      className="font-body text-[14px] leading-relaxed text-white/55"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p
                  className="font-label text-[10px] uppercase tracking-[0.16em]"
                  style={{ color: ARCHIVE.steel }}
                >
                  7. Memory highlights
                </p>
                <ul className="mt-3 space-y-2">
                  {reflection.memoryHighlights.map((item) => (
                    <li
                      key={item}
                      className="font-body text-[14px] leading-relaxed text-white/55"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    requestAnimationFrame(() =>
                      scrollToMonthlyReportsTop(
                        titleRef.current ?? sectionRef.current,
                      ),
                    );
                  }}
                  aria-label="Collapse monthly archive"
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
