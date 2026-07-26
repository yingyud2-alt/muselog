import type { MusePersona } from "@/types/profile";
import { cn } from "@/lib/utils";

type ProfileHeroProps = {
  persona: MusePersona;
  className?: string;
};

export function ProfileHero({ persona, className }: ProfileHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/[0.1] p-8 md:p-10",
        "bg-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 70% 80% at 12% 20%, rgba(109,143,163,0.16), transparent 55%)",
            "radial-gradient(ellipse 55% 60% at 88% 78%, rgba(110,134,130,0.12), transparent 50%)",
            "linear-gradient(160deg, rgba(255,255,255,0.03), transparent 45%)",
          ].join(", "),
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
          Your Muse
        </p>
        <h1 className="font-hero mt-3 text-[34px] font-medium tracking-tight text-white/94 md:text-[40px]">
          {persona.title}
        </h1>
        <p className="font-body mt-4 max-w-lg text-[15px] leading-relaxed text-white/52 md:text-base">
          {persona.description}
        </p>
        <p className="mt-6 text-sm text-white/32">
          Understanding your stories, sounds, and memories.
        </p>
      </div>
    </section>
  );
}
