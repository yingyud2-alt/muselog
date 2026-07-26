import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { type StatItem } from "./mock-data";

type StatsGridProps = {
  items: StatItem[];
};

export function StatsGrid({ items }: StatsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.label}
            className={cn(
              "group cursor-default",
              "bg-white/5",
              "border-white/10",
              "backdrop-blur-xl",
              "shadow-lg",
              "text-white",
              "transition-all duration-300 ease-out",
              "hover:-translate-y-1",
              "hover:bg-white/10",
              "hover:shadow-xl",
            )}
          >
            <CardContent className="flex items-start justify-between gap-4 pt-0">
              <div className="space-y-2">
                <p className="font-label text-3xl font-bold tracking-tight transition-transform duration-300 group-hover:scale-105">
                  {item.value}
                </p>

                <div>
                  <p className="font-display capitalize text-white">
                    {item.label}
                  </p>

                  <p className="font-display text-xs text-white/50">
                    {item.description}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  "bg-white/10",
                  "transition-colors duration-300",
                  "group-hover:bg-white/20",
                )}
              >
                <Icon
                  className="size-4 text-white/60 transition-colors duration-300 group-hover:text-white"
                  aria-hidden="true"
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}