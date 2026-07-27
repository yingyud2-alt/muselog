import { NextResponse } from "next/server";

import {
  enrichOpenLibraryWorks,
  getBooksByCategory,
  getExploreBootstrapBooks,
  getPopularBooks,
  getTrendingBooks,
  OpenLibraryFetchError,
} from "@/services/api/book-service";

export type BookDiscoverMode =
  | "trending"
  | "popular"
  | "category"
  | "bootstrap";

/**
 * Server proxy for Open Library book discovery feeds.
 * Modes: trending | popular | category | bootstrap
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = (searchParams.get("mode") ?? "trending") as BookDiscoverMode;
  const category = searchParams.get("category") ?? "";
  const limitParam = Number(searchParams.get("limit") ?? "24");
  const limit = Number.isFinite(limitParam) ? limitParam : 24;

  try {
    let items;
    if (mode === "popular") {
      items = await getPopularBooks(limit);
    } else if (mode === "category") {
      items = await getBooksByCategory(category, limit);
    } else if (mode === "bootstrap") {
      items = await getExploreBootstrapBooks(4);
    } else {
      items = await getTrendingBooks(limit);
    }

    const enriched = await enrichOpenLibraryWorks(items, Math.min(limit, 16));
    return NextResponse.json({ items: enriched, mode });
  } catch (error) {
    const isDev = process.env.NODE_ENV !== "production";
    const message =
      error instanceof Error ? error.message : "Unknown Open Library error";

    if (isDev) {
      return NextResponse.json(
        {
          items: [],
          mode,
          error: "open_library_fetch_failed",
          message,
          ...(error instanceof OpenLibraryFetchError
            ? { url: error.url, status: error.status }
            : {}),
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { items: [], mode, error: "open_library_fetch_failed" },
      { status: 502 },
    );
  }
}
