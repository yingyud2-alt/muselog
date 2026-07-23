import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { MediaCover } from "./media-cover";
import { type RecentlyAddedItem } from "./mock-data";

type RecentlyAddedCardProps = {
  item: RecentlyAddedItem;
};

export function RecentlyAddedCard({ item }: RecentlyAddedCardProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden p-0 shadow-sm ring-foreground/8",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-lg hover:ring-foreground/12",
      )}
    >
      <div className="overflow-hidden">
        <MediaCover
          title={item.title}
          className={cn(
            "rounded-none rounded-t-xl ring-0",
            "transition-transform duration-500 ease-out group-hover:scale-[1.03]",
            item.coverClassName,
          )}
        />
      </div>
      <CardHeader className="gap-2 pb-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="w-fit capitalize">
            {item.type}
          </Badge>
          <span className="text-xs text-muted-foreground">{item.addedAt}</span>
        </div>
        <CardTitle className="leading-snug transition-colors duration-300 group-hover:text-foreground">
          {item.title}
        </CardTitle>
        <CardDescription>{item.subtitle}</CardDescription>
      </CardHeader>
    </Card>
  );
}
