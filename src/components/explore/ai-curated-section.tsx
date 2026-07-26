import { ExploreCatalog } from "@/components/explore/explore-catalog";

/** Existing mood-based AI recommendation experience, labeled for discovery hierarchy. */
export function AiCuratedSection() {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="font-label text-[10px] uppercase tracking-[0.18em] text-white/35">
          AI Curated For You
        </p>
        <h2 className="font-hero text-2xl font-medium tracking-tight text-white/92 md:text-[28px]">
          Personalized by feeling
        </h2>
        <p className="font-display max-w-xl text-sm text-white/42">
          Recommendations shaped by mood, not popularity charts.
        </p>
      </div>

      <ExploreCatalog />
    </section>
  );
}
