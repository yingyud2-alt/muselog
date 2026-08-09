"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { useLanguage } from "@/components/i18n/language-provider";
import type {
  AiReflectionActivity,
  AiReflectionInput,
  AiReflectionJournalEntry,
  AiReflectionResult,
  AiReflectionUserMedia,
} from "@/lib/ai/ai-reflection-types";
import {
  generateMockAiReflection,
  requestAiReflection,
} from "@/lib/ai/generate-mock-reflection";
import { cn } from "@/lib/utils";

export type { AiReflectionUserMedia, AiReflectionJournalEntry, AiReflectionActivity };

type AiReflectionCardProps = {
  userMedia: AiReflectionUserMedia[];
  journalEntries: AiReflectionJournalEntry[];
  recentActivities: AiReflectionActivity[];
  /** full = Profile; compact = Home entrance */
  variant?: "full" | "compact";
  className?: string;
  /** Optional future AI client. Defaults to mock generator. */
  generateReflection?: (
    input: AiReflectionInput,
  ) => Promise<AiReflectionResult> | AiReflectionResult;
  ctaHref?: string;
  ctaLabel?: string;
};

export function AiReflectionCard({
  userMedia,
  journalEntries,
  recentActivities,
  variant = "full",
  className,
  generateReflection,
  ctaHref,
  ctaLabel,
}: AiReflectionCardProps) {
  const { t } = useLanguage();
  const input = useMemo<AiReflectionInput>(
    () => ({ userMedia, journalEntries, recentActivities }),
    [userMedia, journalEntries, recentActivities],
  );

  const [variation, setVariation] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [customResult, setCustomResult] = useState<AiReflectionResult | null>(
    null,
  );

  const mockResult = useMemo(
    () => generateMockAiReflection(input, { variation }),
    [input, variation],
  );

  const reflection = customResult?.text ?? mockResult.text;
  const themes = customResult?.themes ?? mockResult.themes;

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);

    try {
      if (generateReflection) {
        const result = await generateReflection(input);
        setCustomResult(result);
      } else {
        setCustomResult(null);
        const nextVariation = variation + 1;
        await requestAiReflection(input, { variation: nextVariation });
        setVariation(nextVariation);
      }
    } finally {
      setGenerating(false);
    }
  };

  const isCompact = variant === "compact";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/[0.1]",
        "bg-white/[0.04] shadow-[0_16px_48px_rgba(0,0,0,0.22)] backdrop-blur-2xl",
        isCompact ? "p-5" : "p-6 md:p-7",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 55% 70% at 8% 0%, rgba(122,217,189,0.08), transparent 50%)",
            "radial-gradient(ellipse 50% 60% at 92% 100%, rgba(109,143,163,0.1), transparent 52%)",
          ].join(", "),
        }}
        aria-hidden="true"
      />

      <div className="relative">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex items-center justify-center rounded-xl border border-teal-300/15 bg-teal-400/[0.06]",
              isCompact ? "size-8" : "size-9",
            )}
          >
            <Sparkles
              className={cn(
                "text-teal-200/70",
                isCompact ? "size-3.5" : "size-4",
              )}
              aria-hidden="true"
            />
          </span>
          <div>
            <h2
              className={cn(
                "font-display font-bold text-white/88",
                isCompact ? "text-sm" : "text-[15px]",
              )}
            >
              {t("page.aiReflection")}
            </h2>
            {!isCompact ? (
              <p className="font-display text-[12px] text-white/35">
                A quiet reading of your cultural journey
              </p>
            ) : null}
          </div>
        </div>

        <p
          className={cn(
            "font-body leading-relaxed text-white/68",
            isCompact ? "mt-3.5 text-sm" : "mt-5 text-[15px]",
          )}
        >
          {reflection}
        </p>

        {!isCompact && themes.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {themes.map((theme) => (
              <li
                key={theme}
                className="font-label rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] capitalize text-white/42"
              >
                {theme}
              </li>
            ))}
          </ul>
        ) : null}

        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            isCompact ? "mt-4" : "mt-6",
          )}
        >
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className={cn(
              "inline-flex items-center justify-center rounded-full border border-teal-300/20",
              "bg-teal-400/[0.08] font-display text-sm font-bold text-teal-50/85",
              "transition-colors hover:bg-teal-400/[0.14]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200/20",
              "disabled:opacity-50",
              isCompact ? "px-3.5 py-2 text-[13px]" : "px-4 py-2.5",
            )}
          >
            {generating ? "Listening…" : "Generate Reflection"}
          </button>

          {ctaHref ? (
            <Link
              href={ctaHref}
              className={cn(
                "inline-flex items-center rounded-full border border-white/10 px-3.5 py-2",
                "font-display text-[13px] font-bold text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white/75",
              )}
            >
              {ctaLabel ?? "Open Reflection"}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
