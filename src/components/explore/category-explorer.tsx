"use client";

import { DiscoveryCarousel } from "@/components/explore/discovery-carousel";
import {
  DISCOVERY_CATEGORY_TABS,
  getDiscoverySections,
} from "@/lib/content/explore-discovery";
import { useExploreUiState } from "@/lib/explore/explore-ui-state";
import { cn } from "@/lib/utils";

type CategoryExplorerProps = {
  className?: string;
};

export function CategoryExplorer({ className }: CategoryExplorerProps) {
  const { category, setCategory } = useExploreUiState();
  const sections = getDiscoverySections(category);

  return (
    <section className={cn("space-y-8", className)}>
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="font-label text-[10px] uppercase tracking-[0.18em] text-white/35">
            Category Explorer
          </p>
          <h2 className="font-hero text-2xl font-medium tracking-tight text-white/92 md:text-[28px]">
            Browse by cultural form
          </h2>
          <p className="font-display max-w-xl text-sm text-white/42">
            Switch between books, films, and music — without leaving the page.
          </p>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Discovery categories"
        >
          {DISCOVERY_CATEGORY_TABS.map((tab) => {
            const active = tab.id === category;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(tab.id)}
                className={cn(
                  "rounded-full border px-4 py-2 font-label text-xs tracking-[0.06em] transition-colors",
                  active
                    ? "border-white/28 bg-white/12 text-white/92"
                    : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/18 hover:text-white/72",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-10" role="tabpanel">
        {sections.map((section) => (
          <DiscoveryCarousel
            key={`${category}-${section.module}`}
            title={section.title}
            description={section.description}
            items={section.items}
          />
        ))}
      </div>
    </section>
  );
}
