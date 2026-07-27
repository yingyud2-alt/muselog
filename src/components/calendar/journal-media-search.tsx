"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { MemoryCover } from "@/components/calendar/memory-cover";
import { useAllMemories } from "@/lib/content/memory-store";
import { getContentByMediaKey } from "@/lib/content/bubble-content-bridge";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import { searchMedia, type MediaSearchResult } from "@/lib/content/search";
import { useUserContentMap } from "@/lib/content/user-content-store";
import { useLibraryItems } from "@/lib/library/use-library-items";
import { cn } from "@/lib/utils";

type JournalMediaSearchProps = {
  onSelect: (result: MediaSearchResult) => void;
  className?: string;
};

function resolveCover(result: MediaSearchResult): string {
  const catalog = getContentByMediaKey(result.id);
  // Prefer API/search coverUrl (Open Library) over catalog gradients.
  const fromApi = result.coverUrl?.trim();
  if (
    fromApi &&
    (fromApi.startsWith("http://") ||
      fromApi.startsWith("https://") ||
      fromApi.startsWith("/") ||
      fromApi.startsWith("data:"))
  ) {
    return fromApi;
  }
  return catalog?.cover ?? fromApi ?? "from-slate-800 via-slate-900 to-black";
}

export function JournalMediaSearch({
  onSelect,
  className,
}: JournalMediaSearchProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const { allItems } = useLibraryItems();
  const { memories } = useAllMemories();
  const userContentMap = useUserContentMap();

  const results = useMemo(
    () =>
      searchMedia(query, {
        libraryItems: allItems,
        memories,
        userContentById: userContentMap,
      }).filter(
        (item) =>
          item.type === "BOOK" || item.type === "MOVIE" || item.type === "MUSIC",
      ),
    [allItems, memories, query, userContentMap],
  );

  const showResults = query.trim().length > 0 && focused;

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5",
          "shadow-[0_4px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition-colors",
          focused && "border-white/14 bg-white/[0.06]",
        )}
      >
        <Search className="size-4 shrink-0 text-white/35" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setFocused(false), 150);
          }}
          placeholder="Search books, movies, music..."
          className="min-w-0 flex-1 bg-transparent text-sm text-white/82 placeholder:text-white/35 outline-none"
        />
      </div>

      {showResults && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-white/10 bg-[#10161D]/95 shadow-[0_16px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          {results.length === 0 ? (
            <p className="px-4 py-5 text-sm text-white/45">No matches found.</p>
          ) : (
            <ul className="max-h-56 overflow-y-auto py-1">
              {results.map((item) => (
                <li key={`${item.source}-${item.id}`}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onSelect(item);
                      setQuery("");
                      setFocused(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                  >
                    <MemoryCover
                      cover={resolveCover(item)}
                      title={item.title}
                      className="w-10 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white/88">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-white/45">
                        {item.creator}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-white/30">
                        {CONTENT_TYPE_LABELS[item.type]}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
