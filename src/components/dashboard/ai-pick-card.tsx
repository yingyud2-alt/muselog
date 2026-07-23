import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { type AiPickItem } from "./mock-data";

type AiPickCardProps = {
  item: AiPickItem;
};

export function AiPickCard({ item }: AiPickCardProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer shadow-sm ring-foreground/8",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-md hover:ring-foreground/12",
      )}
    >
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline">{item.categoryLabel}</Badge>
          <Sparkles
            className="size-3.5 text-muted-foreground transition-colors duration-300 group-hover:text-foreground"
            aria-hidden="true"
          />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
          <CardDescription>{item.creator}</CardDescription>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {item.reason}
        </p>
      </CardContent>
    </Card>
  );
}
