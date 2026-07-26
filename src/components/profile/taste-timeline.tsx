"use client";

import type { TasteTimelineMoment } from "@/types/profile";
import { cn } from "@/lib/utils";

type TasteTimelineProps = {
  moments: TasteTimelineMoment[];
  className?: string;
};

export function TasteTimeline({ moments, className }: TasteTimelineProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h2 className="text-xl font-medium tracking-tight text-white/90">
          Taste Timeline
        </h2>
        <p className="text-sm text-white/40">
          How your cultural season has shifted
        </p>
      </div>

      <div className="-mx-1 flex gap-3.5 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
        {moments.map((moment, index) => (
          <article
            key={moment.id}
            className={cn(
              "relative w-[200px] shrink-0 rounded-3xl border border-white/[0.08]",
              "bg-white/[0.035] p-5 shadow-[0_10px_32px_rgba(0,0,0,0.16)] backdrop-blur-xl",
            )}
          >
            {index < moments.length - 1 ? (
              <span
                className="pointer-events-none absolute -right-3 top-1/2 hidden h-px w-3 bg-white/15 md:block"
                aria-hidden="true"
              />
            ) : null}
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/32">
              {moment.year}
            </p>
            <p className="mt-2 text-[15px] font-medium text-white/86">
              {moment.month}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/52">
              {moment.insight}
            </p>
            <p className="mt-4 text-[11px] text-white/30">
              {moment.entryCount}{" "}
              {moment.entryCount === 1 ? "moment" : "moments"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
