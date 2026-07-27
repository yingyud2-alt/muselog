"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type WorkAiInsightSectionProps = {
  preview?: string;
};

/**
 * AI Reflection entry — collapsed placeholder.
 * No live model generation yet.
 */
export function WorkAiInsightSection({
  preview = "A personal reading of why this work sits close to your taste — coming when Muse AI is connected.",
}: WorkAiInsightSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-20 border-t border-white/[0.05] pt-14 md:mt-28 md:pt-16">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15"
      >
        <h2 className="font-display text-[24px] font-medium tracking-tight text-white/90 md:text-[26px]">
          Why this matches your taste
        </h2>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-white/28",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="mt-8 max-w-2xl">
          <p className="text-[15px] leading-relaxed text-white/48">{preview}</p>
          <p className="mt-4 font-label text-[10px] uppercase tracking-[0.14em] text-white/20">
            Placeholder · AI later
          </p>
        </div>
      ) : null}
    </section>
  );
}
