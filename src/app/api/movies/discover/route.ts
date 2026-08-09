import { NextResponse } from "next/server";

import {
  enrichTmdbWorks,
  getExploreBootstrapMovies,
  getMoviesByCategory,
  getNowPlayingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getTrendingMovies,
  TmdbConfigError,
  TmdbFetchError,
} from "@/services/api/movie-service";

export type MovieDiscoverMode =
  | "trending"
  | "popular"
  | "category"
  | "bootstrap"
  | "top_rated"
  | "now_playing";

/**
 * Server proxy for TMDB movie discovery feeds.
 * Modes: trending | popular | category | bootstrap | top_rated | now_playing
 * Response shape: { items: Work[], mode }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = (searchParams.get("mode") ?? "trending") as MovieDiscoverMode;
  const category = searchParams.get("category") ?? "";
  const limitParam = Number(searchParams.get("limit") ?? "24");
  const limit = Number.isFinite(limitParam) ? limitParam : 24;

  try {
    let items;
    if (mode === "popular") {
      items = await getPopularMovies(limit);
    } else if (mode === "category") {
      items = await getMoviesByCategory(category, limit);
    } else if (mode === "bootstrap") {
      items = await getExploreBootstrapMovies(4);
    } else if (mode === "top_rated") {
      items = await getTopRatedMovies(limit);
    } else if (mode === "now_playing") {
      items = await getNowPlayingMovies(limit);
    } else {
      items = await getTrendingMovies(limit);
    }

    const enriched = await enrichTmdbWorks(items, Math.min(limit, 16));
    return NextResponse.json({ items: enriched, mode });
  } catch (error) {
    const isDev = process.env.NODE_ENV !== "production";
    const message =
      error instanceof Error ? error.message : "Unknown TMDB error";
    const errorCode =
      error instanceof TmdbConfigError
        ? error.code
        : "tmdb_fetch_failed";

    if (isDev) {
      return NextResponse.json(
        {
          items: [],
          mode,
          error: errorCode,
          message,
          ...(error instanceof TmdbFetchError
            ? { url: error.url, status: error.status }
            : {}),
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { items: [], mode, error: errorCode },
      { status: 502 },
    );
  }
}
