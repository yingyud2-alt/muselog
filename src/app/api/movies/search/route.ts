import { NextResponse } from "next/server";

import {
  enrichTmdbWorks,
  searchMovies,
  TmdbConfigError,
  TmdbFetchError,
} from "@/services/api/movie-service";

/**
 * Server proxy for TMDB movie search.
 * Keeps TMDB_API_KEY server-side and returns Work[].
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const limitParam = Number(searchParams.get("limit") ?? "12");
  const limit = Number.isFinite(limitParam) ? limitParam : 12;

  try {
    const items = await searchMovies(query, limit);
    const enriched = await enrichTmdbWorks(items, Math.min(limit, 8));
    return NextResponse.json({ items: enriched });
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
      { items: [], error: errorCode },
      { status: 502 },
    );
  }
}
