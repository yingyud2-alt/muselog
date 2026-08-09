"use client";

import Link from "next/link";
import { WandSparkles } from "lucide-react";

import { filterDisplayableApiWorks } from "@/lib/work/displayable-api-work";
import { useImportedWorkMap } from "@/lib/work/imported-work-catalog";

export function SurpriseMuseBox() {
  const importedMap = useImportedWorkMap();
  const pool = filterDisplayableApiWorks(Object.values(importedMap));
  const pick = pool[0];

  if (!pick) {
    return (
      <Link
        href="/explore"
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
            <p className="font-display text-sm font-bold text-white/85">
              Surprise Muse
            </p>
            <p className="font-display mt-0.5 text-xs text-white/45">
              Discover something new
            </p>
            <p className="font-body mt-1 truncate text-[11px] text-white/35">
              Open Explore to load the public catalog
            </p>
          </div>
          <span className="font-display shrink-0 text-xs font-bold text-violet-200/55 transition-colors group-hover:text-violet-200/85">
            Explore
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/explore/${pick.id}`}
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
          <p className="font-display text-sm font-bold text-white/85">Surprise Muse</p>
          <p className="font-display mt-0.5 text-xs text-white/45">Discover something new</p>
          <p className="font-body mt-1 truncate text-[11px] text-white/35">
            {pick.title} · {pick.creator}
          </p>
        </div>
        <span className="font-display shrink-0 text-xs font-bold text-violet-200/55 transition-colors group-hover:text-violet-200/85">
          Reveal
        </span>
      </div>
    </Link>
  );
}
