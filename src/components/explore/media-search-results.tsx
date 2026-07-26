"use client";

import Link from "next/link";

import type { MediaSearchResult } from "@/lib/content/search";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";

type MediaSearchResultsProps = {
  results: MediaSearchResult[];
  query: string;
  onNavigate?: () => void;
};

export function MediaSearchResults({
  results,
  query,
  onNavigate,
}: MediaSearchResultsProps) {
  if (!query.trim()) return null;

  return (
    <div className="absolute inset-x-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-white/10 bg-[#10161D]/95 shadow-[0_16px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      {results.length === 0 ? (
        <div className="px-4 py-5">
          <p className="text-sm font-medium text-white/70">No matches found.</p>
          <p className="mt-1 text-xs text-white/40">
            Try another title, creator, or mood.
          </p>
        </div>
      ) : (
        <ul className="max-h-64 overflow-y-auto py-1">
          {results.map((item) => (
            <li key={`${item.source}-${item.id}`}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className="block px-4 py-3 transition-colors hover:bg-white/[0.04]"
              >
                <p className="text-sm font-medium text-white/88">{item.title}</p>
                <p className="mt-0.5 text-xs text-white/45">{item.meta}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/30">
                  {CONTENT_TYPE_LABELS[item.type]}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
