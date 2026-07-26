import { DiscoveryCard } from "@/components/explore/discovery-card";
import type { ExploreDiscoveryItem } from "@/lib/content/explore-discovery";
import { cn } from "@/lib/utils";

type DiscoveryCarouselProps = {
  title: string;
  description?: string;
  items: ExploreDiscoveryItem[];
  className?: string;
};

export function DiscoveryCarousel({
  title,
  description,
  items,
  className,
}: DiscoveryCarouselProps) {
  if (items.length === 0) return null;

  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h3 className="font-hero text-xl font-medium tracking-tight text-white/90">
          {title}
        </h3>
        {description ? (
          <p className="font-display text-sm text-white/40">{description}</p>
        ) : null}
      </div>

      <div
        className={cn(
          "rounded-3xl border border-white/[0.08] bg-white/[0.03]",
          "p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl md:p-5",
        )}
      >
        <div className="-mx-1 flex gap-3.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {items.map((item) => (
            <DiscoveryCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
