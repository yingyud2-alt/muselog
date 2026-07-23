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
              "group cursor-default shadow-sm ring-foreground/8",
              "transition-all duration-300 ease-out",
              "hover:-translate-y-1 hover:shadow-md hover:ring-foreground/12",
            )}
          >
            <CardContent className="flex items-start justify-between gap-4 pt-0">
              <div className="space-y-2">
                <p className="text-3xl font-semibold tracking-tight transition-transform duration-300 group-hover:scale-105">
                  {item.value}
                </p>
                <div>
                  <p className="font-medium capitalize">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted",
                  "transition-colors duration-300 group-hover:bg-foreground/5",
                )}
              >
                <Icon
                  className="size-4 text-muted-foreground transition-colors duration-300 group-hover:text-foreground"
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
