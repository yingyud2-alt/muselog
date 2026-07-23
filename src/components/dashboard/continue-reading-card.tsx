import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { MediaCover } from "./media-cover";
import { type MediaProgressItem } from "./mock-data";

type MediaProgressCardProps = {
  item: MediaProgressItem;
};

export function MediaProgressCard({ item }: MediaProgressCardProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer shadow-sm ring-foreground/8",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-lg hover:ring-foreground/12",
      )}
    >
      <CardContent className="space-y-4 pt-0">
        <div className="overflow-hidden rounded-xl">
          <MediaCover
            title={item.title}
            className={cn(
              "aspect-[4/3] w-full rounded-xl",
              "transition-transform duration-500 ease-out group-hover:scale-[1.02]",
              item.coverClassName,
            )}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary">{item.categoryLabel}</Badge>
            <span className="text-xs text-muted-foreground">
              {item.lastOpened}
            </span>
          </div>

          <div className="space-y-1">
            <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
            <CardDescription>{item.creator}</CardDescription>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium text-foreground">
                {item.progress}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/80 transition-all duration-500 group-hover:bg-foreground"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 -translate-x-1">
            Continue
            <ArrowRight
              className="size-3 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** @deprecated Use MediaProgressCard — filename kept for compatibility */
export function ContinueReadingCard({ item }: MediaProgressCardProps) {
  return <MediaProgressCard item={item} />;
}
