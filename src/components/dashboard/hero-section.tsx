import { BookOpen } from "lucide-react";

/** Compact desktop branding — used as overlay on the home bubble canvas. */
export function HeroSection() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/88">
        <BookOpen className="size-4" aria-hidden="true" />
      </div>
      <div>
        <p className="font-display text-sm font-bold tracking-tight text-white/90">
          MuseLog
        </p>
        <p className="font-display text-[11px] text-white/42">Your journey, your Muse.</p>
      </div>
    </div>
  );
}
