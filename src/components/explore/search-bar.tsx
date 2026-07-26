"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";

import {
  formatSearchResultMeta,
  searchContentCatalog,
} from "@/lib/content/search";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  className?: string;
  placeholder?: string;
};

export function SearchBar({
  className,
  placeholder = "Search books, movies, albums...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => searchContentCatalog(query), [query]);
  const showResults = focused && query.trim().length > 0;

  return (
    <div className={cn("relative", className)}>
      <label className="sr-only" htmlFor="explore-search">
        Search catalog
      </label>
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3",
          "shadow-[0_4px_24px_rgba(0,0,0,0.12)] backdrop-blur-md",
          focused && "border-white/14 bg-white/[0.06]",
        )}
      >
        <Search className="size-4 shrink-0 text-white/35" aria-hidden="true" />
        <input
          id="explore-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setFocused(false), 150);
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-white/82 placeholder:text-white/35 outline-none"
        />
      </div>

      {showResults && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-white/10 bg-[#10161D]/95 shadow-[0_16px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          {results.length === 0 ? (
            <p className="px-4 py-5 text-sm text-white/45">No matches found.</p>
          ) : (
            <ul className="max-h-64 overflow-y-auto py-1">
              {results.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/explore/${item.id}`}
                    className="block px-4 py-3 transition-colors hover:bg-white/[0.04]"
                  >
                    <p className="text-sm font-medium text-white/88">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-white/45">
                      {formatSearchResultMeta(item)}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/30">
                      {CONTENT_TYPE_LABELS[item.type]}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
