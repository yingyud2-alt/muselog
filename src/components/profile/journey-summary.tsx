import type { ProfileStats } from "@/types/profile";
import { cn } from "@/lib/utils";

type JourneySummaryProps = {
  stats: ProfileStats;
  className?: string;
};

export function JourneySummary({ stats, className }: JourneySummaryProps) {
  const items = [
    {
      label: stats.books === 1 ? "Book" : "Books",
      value: stats.books,
    },
    {
      label: stats.movies === 1 ? "Movie" : "Movies",
      value: stats.movies,
    },
    {
      label: "Music",
      value: stats.music,
    },
  ];

  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h2 className="text-xl font-medium tracking-tight text-white/90">
          Your Journey
        </h2>
        <p className="text-sm text-white/40">
          A soft count of what you have gathered
        </p>
      </div>

      <div
        className={cn(
          "rounded-3xl border border-white/[0.08] bg-white/[0.035] px-6 py-5",
          "shadow-[0_10px_32px_rgba(0,0,0,0.16)] backdrop-blur-xl",
        )}
      >
        <p className="text-[15px] tracking-wide text-white/55">
          {items
            .map((item) => `${item.value} ${item.label}`)
            .join("  ·  ")}
        </p>
        <p className="mt-2 text-[12px] text-white/30">
          {stats.ongoing > 0
            ? `${stats.ongoing} still unfolding`
            : `${stats.finished} finished memories`}
        </p>
      </div>
    </section>
  );
}
