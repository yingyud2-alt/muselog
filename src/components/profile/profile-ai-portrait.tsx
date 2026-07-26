"use client";

import { useEffect, useState } from "react";

import { MemoryCover } from "@/components/calendar/memory-cover";
import { ProfileMonthlyReflection } from "@/components/profile/profile-monthly-reflection";
import { ProfileNextMuse } from "@/components/profile/profile-next-muse";
import { ProfileTasteDnaTags } from "@/components/profile/profile-taste-dna-tags";
import { ProfileYearArchive } from "@/components/profile/profile-year-archive";
import { useMuseProfile } from "@/lib/profile/use-muse-profile";
import type {
  MusePortrait,
  MuseTasteRankItem,
  MuseTasteRankings,
} from "@/lib/profile/muse-profile-data";
import { cn } from "@/lib/utils";

type RankTab = keyof MuseTasteRankings;

type ProfileAiPortraitProps = {
  className?: string;
};

const PROFILE_SCROLL_ANCHORS = new Set([
  "full-reflection",
  "monthly-reports",
  "year-archive",
]);

/**
 * Profile AI Reflection — long-term cultural identity archive.
 * Journal owns monthly reports; Profile owns identity + year archive.
 */
export function ProfileAiPortrait({ className }: ProfileAiPortraitProps) {
  const { profile } = useMuseProfile();
  const [rankTab, setRankTab] = useState<RankTab>("books");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    // Monthly Reports handles its own scroll + month restore.
    if (!hash || hash === "monthly-reports" || !PROFILE_SCROLL_ANCHORS.has(hash)) {
      return;
    }

    const timer = window.setTimeout(() => {
      const target = document.getElementById(hash);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timer);
  }, []);

  const {
    portrait,
    persona,
    keywords,
    yearReflection,
    tasteRankings,
    tasteTimeline,
    recommendations,
  } = profile;

  return (
    <div className={cn("space-y-5 md:space-y-6", className)}>
      {/* Full Reflection — AI persona / taste DNA / cultural identity */}
      <section
        id="full-reflection"
        className={cn(
          "relative overflow-hidden rounded-[28px] border border-white/[0.09]",
          "bg-white/[0.035] shadow-[0_20px_60px_rgba(0,0,0,0.24)]",
          "scroll-mt-24",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse 70% 80% at 18% 10%, rgba(122,217,189,0.07), transparent 52%)",
              "radial-gradient(ellipse 55% 60% at 88% 85%, rgba(109,143,163,0.09), transparent 50%)",
              "linear-gradient(165deg, rgba(255,255,255,0.03), transparent 42%)",
            ].join(", "),
          }}
          aria-hidden="true"
        />

        <div className="relative px-6 py-8 md:px-10 md:py-11">
          <div className="flex flex-col items-center text-center">
            <AiPortraitPlaceholder
              portrait={portrait}
              personaName={persona.personaName}
            />

            <p className="font-label mt-7 text-[11px] uppercase tracking-[0.2em] text-white/35">
              Full Reflection · Cultural Identity
            </p>

            <h1 className="font-hero mt-3 text-[30px] font-medium tracking-tight text-white/94 md:text-[38px]">
              {persona.personaName}
            </h1>

            <p className="font-body mt-4 max-w-md text-[15px] leading-relaxed text-white/55 md:text-base">
              {persona.description}
            </p>

            <p className="mt-4 font-display text-[12px] text-white/38">
              AI confidence{" "}
              <span className="text-white/70">{persona.confidence}%</span>
            </p>

            <p className="font-label mt-8 text-[10px] uppercase tracking-[0.16em] text-white/32">
              Taste DNA
            </p>
            <ProfileTasteDnaTags keywords={keywords} className="mt-5" />
          </div>
        </div>
      </section>

      {/* 3. Taste Ranking — always visible */}
      <section
        className={cn(
          "rounded-[24px] border border-white/[0.08] bg-white/[0.03]",
          "px-5 py-6 md:px-7 md:py-7",
        )}
      >
        <p className="font-label text-center text-[10px] uppercase tracking-[0.18em] text-white/32">
          Your Taste Ranking
        </p>
        <p className="mt-2 text-center font-display text-sm text-white/40">
          Ranked by AI resonance with your cultural identity
        </p>

        <div
          className="mx-auto mt-6 flex max-w-sm rounded-full border border-white/10 bg-white/[0.03] p-1"
          role="tablist"
          aria-label="Taste ranking categories"
        >
          {(
            [
              ["books", "Books"],
              ["movies", "Movies"],
              ["music", "Music"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={rankTab === key}
              onClick={() => setRankTab(key)}
              className={cn(
                "flex-1 rounded-full py-2 font-display text-[12px] font-bold transition-colors",
                rankTab === key
                  ? "bg-white/[0.1] text-white/88"
                  : "text-white/42 hover:text-white/65",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="mx-auto mt-6 max-w-xl space-y-3">
          {tasteRankings[rankTab].map((item, index) => (
            <TasteRankRow key={item.id} item={item} rank={index + 1} />
          ))}
        </ul>
      </section>

      {/* Monthly Reports archive — links into Journal months */}
      <ProfileMonthlyReflection />

      {/* Year Cultural Archive */}
      <ProfileYearArchive
        reflection={yearReflection}
        tasteTimeline={tasteTimeline}
      />

      {/* Your Next Muse */}
      <ProfileNextMuse recommendations={recommendations} />
    </div>
  );
}

function TasteRankRow({
  item,
  rank,
}: {
  item: MuseTasteRankItem;
  rank: number;
}) {
  return (
    <li className="flex gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.14)]">
      <div className="relative shrink-0">
        <MemoryCover
          cover={item.cover}
          title={item.title}
          className="w-14 rounded-xl"
        />
        <span className="absolute -left-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-white/15 bg-[#10161D]/90 font-display text-[10px] font-bold text-white/70">
          {rank}
        </span>
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-display text-[14px] font-bold text-white/90">
              {item.title}
            </p>
            <p className="truncate text-[12px] text-white/42">{item.creator}</p>
          </div>
          <p className="shrink-0 font-display text-[12px] font-bold text-teal-100/55">
            {item.resonance}%
          </p>
        </div>
        <p className="font-label mt-1 text-[10px] uppercase tracking-[0.12em] text-white/30">
          Resonance
        </p>
        <p className="font-body mt-2 text-[12px] leading-relaxed text-white/52">
          {item.explanation}
        </p>
      </div>
    </li>
  );
}

function AiPortraitPlaceholder({
  portrait,
  personaName,
}: {
  portrait: MusePortrait;
  personaName: string;
}) {
  if (portrait.illustrationUrl) {
    return (
      // Future AI illustration URL
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={portrait.illustrationUrl}
        alt={portrait.portraitDescription}
        className="size-[148px] rounded-full object-cover md:size-[168px]"
      />
    );
  }

  return (
    <div
      className="relative flex size-[148px] items-center justify-center md:size-[168px]"
      role="img"
      aria-label={portrait.portraitDescription}
      data-portrait-type={portrait.portraitType}
    >
      <svg
        viewBox="0 0 160 160"
        className="absolute inset-0 size-full"
        fill="none"
      >
        <circle
          cx="80"
          cy="80"
          r="74"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        <circle
          cx="80"
          cy="80"
          r="58"
          stroke="rgba(122,217,189,0.22)"
          strokeWidth="1"
        />
        <path
          d="M48 98c8 14 24 22 32 22s24-8 32-22"
          stroke="rgba(250,248,244,0.28)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle
          cx="64"
          cy="70"
          r="3"
          stroke="rgba(250,248,244,0.35)"
          strokeWidth="1"
        />
        <circle
          cx="96"
          cy="70"
          r="3"
          stroke="rgba(250,248,244,0.35)"
          strokeWidth="1"
        />
        <path
          d="M54 52c8-10 18-14 26-14s18 4 26 14"
          stroke="rgba(109,143,163,0.45)"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <path
          d="M80 84v10"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle
          cx="112"
          cy="104"
          r="10"
          stroke="rgba(143,203,171,0.28)"
          strokeWidth="1"
        />
      </svg>
      <span className="sr-only">{personaName} portrait</span>
    </div>
  );
}
