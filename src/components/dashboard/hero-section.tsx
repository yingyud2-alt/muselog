import { Sparkles } from "lucide-react";

import {
  formatDisplayWeekday,
  getDisplayGreeting,
} from "@/lib/display-date";

export function HeroSection() {
  return (
    <div className="relative flex h-[360px] items-center justify-center overflow-hidden text-center">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at 50% 38%, rgba(80,110,130,0.08) 0%, transparent 68%)",
        }}
      />

      <div className="relative space-y-5">
        <div className="flex items-center justify-center gap-2 text-sm text-white/40">
          <Sparkles size={14} />
          {formatDisplayWeekday()}
        </div>

        <h1 className="text-5xl font-semibold tracking-tight text-white">
          {getDisplayGreeting()} 👋
        </h1>

        <p className="text-xl text-white/60">What does your mind need today?</p>

        <p className="text-sm text-white/40">
          Discover something that matches your mood.
        </p>

        <button
          type="button"
          className="mt-3 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm backdrop-blur transition hover:bg-white/20"
        >
          ✨ Surprise me
        </button>
      </div>
    </div>
  );
}
