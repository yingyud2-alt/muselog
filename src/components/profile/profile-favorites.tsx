"use client";

import { MemoryCover } from "@/components/calendar/memory-cover";
import { MemoryStars } from "@/components/calendar/memory-stars";
import type { ProfileFavorite } from "@/types/profile";

type ProfileFavoritesProps = {
  favorites: ProfileFavorite[];
  onSelect: (item: ProfileFavorite) => void;
};

export function ProfileFavorites({ favorites, onSelect }: ProfileFavoritesProps) {
  return (
    <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm md:p-6">
      <h2 className="text-sm font-medium text-white/62">Highest Rated</h2>

      {favorites.length === 0 ? (
        <p className="mt-4 text-sm text-white/42">
          Rate finished works to see your favorites here.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {favorites.map((item) => (
            <li key={item.mediaKey}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15"
              >
                <MemoryCover
                  cover={item.cover}
                  title={item.title}
                  className="w-12 shrink-0 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/85">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-white/42">{item.creator}</p>
                  {item.rating && item.rating > 0 && (
                    <div className="mt-1.5">
                      <MemoryStars rating={item.rating} size="xs" />
                    </div>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
