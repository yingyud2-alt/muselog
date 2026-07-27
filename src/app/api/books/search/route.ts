import { NextResponse } from "next/server";

import {
  enrichOpenLibraryWorks,
  OpenLibraryFetchError,
  searchBooks,
} from "@/services/api/book-service";

/**
 * Server proxy for Open Library book search.
 * Keeps OPEN_LIBRARY_API_URL server-side and returns Work[].
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const limitParam = Number(searchParams.get("limit") ?? "12");
  const limit = Number.isFinite(limitParam) ? limitParam : 12;

  try {
    const items = await searchBooks(query, limit);
    const enriched = await enrichOpenLibraryWorks(items, Math.min(limit, 8));
    return NextResponse.json({ items: enriched });
  } catch (error) {
    const isDev = process.env.NODE_ENV !== "production";
    const message =
      error instanceof Error ? error.message : "Unknown Open Library error";

    if (isDev) {
      return NextResponse.json(
        {
          items: [],
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
      { items: [], error: "open_library_fetch_failed" },
      { status: 502 },
    );
  }
}
