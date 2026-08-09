import { NextResponse } from "next/server";

import {
  discoverMusic,
  enrichLastfmWorks,
  LastfmConfigError,
  LastfmFetchError,
  type MusicDiscoverMode,
} from "@/services/api/music-service";

/**
 * Server proxy for Last.fm music discovery feeds.
 * Modes: popular | trending | bootstrap | category
 * Response shape: { items: Work[], mode }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = (searchParams.get("mode") ?? "popular") as MusicDiscoverMode;
  const category = searchParams.get("category") ?? "";
  const limitParam = Number(searchParams.get("limit") ?? "24");
  const limit = Number.isFinite(limitParam) ? limitParam : 24;

  try {
    const items = await discoverMusic(mode, limit, category);
    const enriched = await enrichLastfmWorks(items, Math.min(limit, 12));
    return NextResponse.json({ items: enriched, mode });
  } catch (error) {
    const isDev = process.env.NODE_ENV !== "production";
    const message =
      error instanceof Error ? error.message : "Unknown Last.fm error";
    const errorCode =
      error instanceof LastfmConfigError
        ? error.code
        : "lastfm_fetch_failed";

    if (isDev) {
      return NextResponse.json(
        {
          items: [],
          mode,
          error: errorCode,
          message,
          ...(error instanceof LastfmFetchError
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
