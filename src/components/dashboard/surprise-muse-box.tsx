"use client";

import Link from "next/link";
import { WandSparkles } from "lucide-react";

import { aiPicks } from "@/components/dashboard/mock-data";
import { CONTENT_CATALOG } from "@/lib/content/content-data";

function resolveSurpriseHref(title: string): string {
  const match = CONTENT_CATALOG.find(
    (entry) => entry.title.toLowerCase() === title.toLowerCase(),
  );
  return match ? `/explore/${match.id}` : "/explore";
}

export function SurpriseMuseBox() {
  const pick = aiPicks[0];

  return (
    <Link
      href={resolveSurpriseHref(pick.title)}
      className="group mx-auto block max-w-3xl rounded-2xl border border-violet-400/12 bg-gradient-to-r from-violet-500/[0.06] via-white/[0.04] to-teal-500/[0.05] px-4 py-3.5 backdrop-blur-md transition-colors hover:border-violet-300/20 hover:from-violet-500/[0.09] md:px-5"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-500/[0.08] shadow-[0_0_24px_rgba(139,92,246,0.12)]">
          <WandSparkles
            className="size-4 text-violet-200/80"
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white/85">Surprise Muse</p>
          <p className="mt-0.5 text-xs text-white/45">Discover something new</p>
          <p className="mt-1 truncate text-[11px] text-white/35">
            {pick.title} · {pick.creator}
          </p>
        </div>
        <span className="shrink-0 text-xs text-violet-200/55 transition-colors group-hover:text-violet-200/85">
          Reveal
        </span>
      </div>
    </Link>
  );
}
