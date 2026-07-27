import { Suspense } from "react";

import { AiCuratedSection } from "@/components/explore/ai-curated-section";
import { CategoryExplorer } from "@/components/explore/category-explorer";
import { ExploreReturnBridge } from "@/components/explore/explore-return-bridge";
import { ExploreSearchHydrator } from "@/components/explore/explore-search-hydrator";
import { SearchBar } from "@/components/explore/search-bar";
import { MobileExplore } from "@/components/mobile/MobileExplore";

export default function ExplorePage() {
  return (
    <main className="min-h-[100svh] overflow-x-hidden bg-[#0D1117] text-white md:min-h-screen">
      <ExploreReturnBridge />

      <div className="md:hidden">
        <MobileExplore />
      </div>

      <div className="mx-auto hidden max-w-6xl space-y-14 px-6 py-8 pb-[calc(env(safe-area-inset-bottom)+32px)] md:block md:px-8 md:py-10">
        <Suspense fallback={null}>
          <ExploreSearchHydrator />
        </Suspense>

        <header className="max-w-2xl">
          <p className="font-label text-[11px] uppercase tracking-[0.16em] text-white/38">
            Explore
          </p>
          <h1 className="font-hero mt-2 text-3xl font-medium tracking-tight text-white/95 md:text-4xl">
            Discover something that matches your feeling.
          </h1>
          <p className="font-display mt-3 text-sm leading-relaxed text-white/48 md:text-base">
            Browse books, films, and music — then save what resonates to your
            personal MuseLog.
          </p>
        </header>

        <SearchBar className="max-w-2xl" />

        <AiCuratedSection />

        <CategoryExplorer />
      </div>
    </main>
  );
}
