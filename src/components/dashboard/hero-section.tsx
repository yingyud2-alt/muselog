import { Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export function HeroSection() {
  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-muted/70 via-card to-muted/30 shadow-sm ring-1 ring-foreground/8">
      <CardContent className="relative py-8 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-foreground/5 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 left-1/3 size-32 rounded-full bg-foreground/3 blur-2xl"
        />

        <div className="relative space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="size-3.5" aria-hidden="true" />
            <time dateTime={new Date().toISOString().split("T")[0]}>
              {formatToday()}
            </time>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Good evening 👋
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              Your personal reading and media journal. Pick up where you left
              off, or discover something new tonight.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
