"use client";

import { useMemo, useState } from "react";

import { LibraryShelf } from "@/components/library/library-shelf";
import { MuseEmptyState } from "@/components/shared/muse-empty-state";
import { getLibraryItemReason } from "@/lib/library/library-items";
import type { LibraryItem, LibraryMediaType } from "@/lib/library/library-types";
import { cn } from "@/lib/utils";

const WAITING_TABS: Array<{ id: LibraryMediaType; label: string }> = [
  { id: "BOOK", label: "Want to Read" },
  { id: "MOVIE", label: "Want to Watch" },
  { id: "MUSIC", label: "Want to Listen" },
];

type WaitingShelfProps = {
  items: LibraryItem[];
  onSelect: (item: LibraryItem) => void;
};

export function WaitingShelf({ items, onSelect }: WaitingShelfProps) {
  const [tab, setTab] = useState<LibraryMediaType>("BOOK");

  const filtered = useMemo(
    () => items.filter((item) => item.type === tab),
    [items, tab],
  );

  const counts = useMemo(
    () => ({
      BOOK: items.filter((item) => item.type === "BOOK").length,
      MOVIE: items.filter((item) => item.type === "MOVIE").length,
      MUSIC: items.filter((item) => item.type === "MUSIC").length,
    }),
    [items],
  );

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-medium tracking-tight text-white/90">
          Waiting For
        </h2>
        <p className="text-sm text-white/40">
          Quiet lists for what comes next
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {WAITING_TABS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={tab === option.id}
            onClick={() => setTab(option.id)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15",
              tab === option.id
                ? "border-white/18 bg-white/[0.08] text-white/88"
                : "border-white/[0.08] text-white/42 hover:bg-white/[0.04] hover:text-white/62",
            )}
          >
            {option.label}
            {counts[option.id] > 0 ? (
              <span className="ml-1.5 text-white/30">{counts[option.id]}</span>
            ) : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <MuseEmptyState
          title="Your waiting list is quiet."
          description="Save something you want to read, watch, or listen to."
          actionLabel="Explore titles"
          actionHref="/explore"
        />
      ) : (
        <LibraryShelf
          items={filtered}
          onSelect={onSelect}
          cardWidth="md"
          variant="collectible"
          showReason
          getReason={getLibraryItemReason}
        />
      )}
    </section>
  );
}
