"use client";

import type { ExternalRating } from "@/types/work";

type WorkCommunitySectionProps = {
  ratings?: ExternalRating[];
};

function formatExternalScore(rating: ExternalRating): string {
  const value =
    Number.isInteger(rating.value) && rating.scale >= 10
      ? rating.value.toFixed(1)
      : Number.isInteger(rating.value)
        ? String(rating.value)
        : rating.value.toFixed(1);
  return `${value} / ${rating.scale}`;
}

function sourceLabel(source: string): string {
  const key = source.trim().toLowerCase();
  if (key === "goodreads") return "Goodreads";
  if (key === "imdb") return "IMDb";
  if (key === "letterboxd") return "Letterboxd";
  if (key === "open_library") return "Open Library";
  if (key === "tmdb") return "TMDB";
  if (key === "lastfm" || key === "last.fm") return "Last.fm";
  if (!source) return "Community";
  return source.charAt(0).toUpperCase() + source.slice(1);
}

/**
 * Community — external ratings as quiet editorial rows.
 */
export function WorkCommunitySection({ ratings }: WorkCommunitySectionProps) {
  const list = ratings?.filter(
    (row) =>
      Boolean(row.source?.trim()) &&
      Number.isFinite(row.value) &&
      Number.isFinite(row.scale) &&
      row.scale > 0,
  );

  return (
    <section className="mt-20 border-t border-white/[0.05] pt-14 md:mt-28 md:pt-16">
      <h2 className="font-display text-[24px] font-medium tracking-tight text-white/90 md:text-[26px]">
        Community rating
      </h2>

      {!list?.length ? (
        <p className="mt-8 text-[14px] text-white/34">
          External ratings will appear here when connected.
        </p>
      ) : (
        <ul className="mt-10 max-w-md space-y-8">
          {list.map((rating) => (
            <li
              key={`${rating.source}-${rating.scale}`}
              className="flex items-baseline justify-between gap-8"
            >
              <div>
                <p className="text-[14px] text-white/55">
                  {sourceLabel(rating.source)}
                </p>
                {typeof rating.count === "number" ? (
                  <p className="mt-1 text-[12px] text-white/28">
                    {rating.count.toLocaleString()} ratings
                  </p>
                ) : null}
              </div>
              <p className="font-display text-[20px] font-medium tabular-nums text-white/86">
                {formatExternalScore(rating)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
