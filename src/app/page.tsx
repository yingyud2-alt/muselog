import {
  BookOpen,
  Film,
  Headphones,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ContinueReadingItem = {
  title: string;
  subtitle: string;
  type: "book" | "movie";
  progress: number;
  coverClassName: string;
};

type RecentlyAddedItem = {
  title: string;
  subtitle: string;
  type: "book" | "movie";
  coverClassName: string;
};

type StatItem = {
  label: string;
  value: number;
  icon: LucideIcon;
};

const continueReading: ContinueReadingItem[] = [
  {
    title: "Norwegian Wood",
    subtitle: "Haruki Murakami",
    type: "book",
    progress: 68,
    coverClassName: "from-emerald-700 via-teal-800 to-slate-900",
  },
  {
    title: "Atomic Habits",
    subtitle: "James Clear",
    type: "book",
    progress: 42,
    coverClassName: "from-amber-500 via-orange-600 to-rose-700",
  },
];

const recentlyAdded: RecentlyAddedItem[] = [
  {
    title: "Interstellar",
    subtitle: "Christopher Nolan",
    type: "movie",
    coverClassName: "from-slate-800 via-indigo-950 to-black",
  },
  {
    title: "Merry Christmas Mr. Lawrence",
    subtitle: "Nagisa Oshima",
    type: "movie",
    coverClassName: "from-stone-600 via-neutral-700 to-zinc-900",
  },
];

const readingStats: StatItem[] = [
  { label: "books", value: 12, icon: BookOpen },
  { label: "movies", value: 8, icon: Film },
  { label: "hours listening", value: 24, icon: Headphones },
];

function MediaCover({
  title,
  className,
}: {
  title: string;
  className: string;
}) {
  return (
    <div
      className={cn(
        "relative flex aspect-[2/3] w-full shrink-0 items-end overflow-hidden rounded-lg bg-gradient-to-br shadow-sm",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/10" />
      <p className="relative line-clamp-3 p-3 text-xs font-medium leading-snug text-white/90">
        {title}
      </p>
    </div>
  );
}

function ContinueReadingCard({ item }: { item: ContinueReadingItem }) {
  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex gap-4 pt-0">
        <MediaCover
          title={item.title}
          className={cn("w-24 sm:w-28", item.coverClassName)}
        />
        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div className="space-y-1.5">
            <Badge variant="secondary" className="capitalize">
              {item.type}
            </Badge>
            <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
            <CardDescription>{item.subtitle}</CardDescription>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{item.progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/80 transition-all"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentlyAddedCard({ item }: { item: RecentlyAddedItem }) {
  return (
    <Card className="overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <MediaCover title={item.title} className={item.coverClassName} />
      <CardHeader className="gap-2 pb-0">
        <Badge variant="outline" className="w-fit capitalize">
          {item.type}
        </Badge>
        <CardTitle className="leading-snug">{item.title}</CardTitle>
        <CardDescription>{item.subtitle}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function StatCard({ item }: { item: StatItem }) {
  const Icon = item.icon;

  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-4 pt-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight">{item.value}</p>
          <p className="text-sm text-muted-foreground">{item.label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  return (
    <div className="flex-1 bg-background">
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-10 sm:px-8 sm:py-12">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Good evening 👋
          </h1>
          <p className="text-muted-foreground">
            Pick up where you left off, or explore something new.
          </p>
        </header>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-medium tracking-tight">
              Continue Reading
            </h2>
            <p className="text-sm text-muted-foreground">
              Your in-progress books and media
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {continueReading.map((item) => (
              <ContinueReadingCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-medium tracking-tight">
              Recently Added
            </h2>
            <p className="text-sm text-muted-foreground">
              Fresh entries in your library
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {recentlyAdded.map((item) => (
              <RecentlyAddedCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-medium tracking-tight">
              Reading Stats
            </h2>
            <p className="text-sm text-muted-foreground">
              A snapshot of your media journal
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {readingStats.map((item) => (
              <StatCard key={item.label} item={item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
