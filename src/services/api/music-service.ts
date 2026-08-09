import {
  createImportedWork,
  lastfmWorkId,
} from "@/lib/work/create-imported-work";
import type { MusicService } from "@/services/api/media-service-types";
import type { Work, WorkListResult } from "@/services/types/work";

export const LASTFM_SOURCE = "lastfm";

const LASTFM_TIMEOUT_MS = 15_000;
const LASTFM_API_BASE = "https://ws.audioscrobbler.com/2.0/";

/** Thrown when Last.fm HTTP fails — routes surface this in development. */
export class LastfmFetchError extends Error {
  readonly code = "lastfm_fetch_failed" as const;
  readonly url: string;
  readonly status?: number;

  constructor(message: string, url: string, status?: number) {
    super(message);
    this.name = "LastfmFetchError";
    this.url = url;
    this.status = status;
  }
}

/** Thrown when LASTFM_API_KEY is missing on the server. */
export class LastfmConfigError extends Error {
  readonly code = "lastfm_config_missing" as const;

  constructor(message = "LASTFM_API_KEY is not configured") {
    super(message);
    this.name = "LastfmConfigError";
  }
}

/** Base URL for Last.fm — override via LASTFM_API_URL. */
export function getLastfmApiUrl(): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.LASTFM_API_URL?.trim()
      : undefined;
  return fromEnv && fromEnv.length > 0
    ? fromEnv.replace(/\/$/, "") + "/"
    : LASTFM_API_BASE;
}

/** Server-side API key only — never expose via NEXT_PUBLIC_*. */
export function getLastfmApiKey(): string {
  const key =
    typeof process !== "undefined" ? process.env.LASTFM_API_KEY?.trim() : "";
  return key ?? "";
}

let cachedProxyUrl: string | null | undefined;

/**
 * Resolve outbound proxy for server-side Last.fm calls.
 * Isolated from book/movie services.
 */
async function resolveOutboundProxyUrl(): Promise<string | null> {
  if (cachedProxyUrl !== undefined) return cachedProxyUrl;

  const fromEnv =
    process.env.LASTFM_PROXY?.trim() ||
    process.env.ALL_PROXY?.trim() ||
    process.env.all_proxy?.trim() ||
    process.env.HTTPS_PROXY?.trim() ||
    process.env.https_proxy?.trim() ||
    process.env.HTTP_PROXY?.trim() ||
    process.env.http_proxy?.trim() ||
    "";

  if (fromEnv) {
    cachedProxyUrl = fromEnv;
    return cachedProxyUrl;
  }

  if (process.platform === "darwin") {
    try {
      const { execFile } = await import("node:child_process");
      const { promisify } = await import("node:util");
      const execFileAsync = promisify(execFile);
      const { stdout } = await execFileAsync("scutil", ["--proxy"], {
        timeout: 2_000,
      });
      const enabled = /SOCKSEnable\s*:\s*1/.test(stdout);
      const host = stdout.match(/SOCKSProxy\s*:\s*(\S+)/)?.[1];
      const port = stdout.match(/SOCKSPort\s*:\s*(\d+)/)?.[1];
      if (enabled && host && port) {
        cachedProxyUrl = `socks5h://${host}:${port}`;
        return cachedProxyUrl;
      }
    } catch {
      // No system SOCKS — fall through to direct.
    }
  }

  cachedProxyUrl = null;
  return null;
}

function lastfmHeaders(): Record<string, string> {
  return {
    Accept: "application/json",
    "User-Agent": "MuseLog/1.0 (contact@example.com)",
  };
}

async function lastfmFetchViaAgent(
  url: string,
  proxyUrl: string,
): Promise<Response> {
  const { request } = await import("node:https");
  const { SocksProxyAgent } = await import("socks-proxy-agent");
  const agent = new SocksProxyAgent(proxyUrl);

  return new Promise<Response>((resolve, reject) => {
    const req = request(
      url,
      {
        method: "GET",
        headers: lastfmHeaders(),
        agent,
        timeout: LASTFM_TIMEOUT_MS,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks);
          resolve(
            new Response(body, {
              status: res.statusCode ?? 500,
              statusText: res.statusMessage ?? "",
              headers: res.headers as HeadersInit,
            }),
          );
        });
      },
    );

    req.on("timeout", () => {
      req.destroy();
      reject(
        new LastfmFetchError(
          `Last.fm request timed out after ${LASTFM_TIMEOUT_MS}ms`,
          url,
        ),
      );
    });
    req.on("error", (error) => {
      reject(
        new LastfmFetchError(error.message || "Last.fm socket error", url),
      );
    });
    req.end();
  });
}

/**
 * Robust server-side Last.fm request.
 * Requires LASTFM_API_KEY. Timeout + optional SOCKS proxy.
 */
async function lastfmFetch(
  method: string,
  params: Record<string, string | number | undefined> = {},
  options: { cache?: RequestCache } = {},
): Promise<Response> {
  const apiKey = getLastfmApiKey();
  if (!apiKey) {
    throw new LastfmConfigError();
  }

  try {
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  } catch {
    // Non-Node runtimes ignore this.
  }

  const url = new URL(getLastfmApiUrl());
  url.searchParams.set("method", method);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("format", "json");
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  const href = url.toString();
  const redactedUrl = href.replaceAll(apiKey, "***");
  const proxyUrl = await resolveOutboundProxyUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LASTFM_TIMEOUT_MS);

  try {
    let response: Response;

    if (proxyUrl) {
      response = await lastfmFetchViaAgent(href, proxyUrl);
    } else {
      let dispatcher: unknown;
      try {
        const undici = await import("undici");
        dispatcher = new undici.Agent({
          connectTimeout: LASTFM_TIMEOUT_MS,
          headersTimeout: LASTFM_TIMEOUT_MS,
          bodyTimeout: LASTFM_TIMEOUT_MS,
          connect: { timeout: LASTFM_TIMEOUT_MS, family: 4 },
        });
      } catch {
        dispatcher = undefined;
      }

      response = await fetch(href, {
        method: "GET",
        headers: lastfmHeaders(),
        signal: controller.signal,
        cache: options.cache ?? "no-store",
        redirect: "follow",
        ...(dispatcher ? { dispatcher } : {}),
      } as RequestInit);
    }

    if (!response.ok) {
      throw new LastfmFetchError(
        `Last.fm HTTP ${response.status}`,
        redactedUrl,
        response.status,
      );
    }

    return response;
  } catch (error) {
    if (error instanceof LastfmFetchError) throw error;
    if (error instanceof LastfmConfigError) throw error;

    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? `Last.fm request timed out after ${LASTFM_TIMEOUT_MS}ms`
          : error.message
        : String(error);

    throw new LastfmFetchError(message, redactedUrl);
  } finally {
    clearTimeout(timer);
  }
}

type LastfmImage = {
  size?: string;
  "#text"?: string;
  text?: string;
};

type LastfmAlbumHit = {
  name?: string;
  artist?: string | { name?: string; "#text"?: string };
  mbid?: string;
  url?: string;
  image?: LastfmImage[];
  listeners?: string | number;
  playcount?: string | number;
};

type LastfmArtistHit = {
  name?: string;
  mbid?: string;
  url?: string;
  image?: LastfmImage[];
  listeners?: string | number;
};

type LastfmTrackHit = {
  name?: string;
  artist?: string | { name?: string; "#text"?: string };
  mbid?: string;
  url?: string;
  image?: LastfmImage[];
  listeners?: string | number;
  playcount?: string | number;
};

type LastfmAlbumInfo = LastfmAlbumHit & {
  wiki?: { summary?: string; content?: string };
  tags?: { tag?: Array<{ name?: string }> | { name?: string } };
  toptags?: { tag?: Array<{ name?: string }> | { name?: string } };
  releasedate?: string;
  tracks?: unknown;
};

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function pickArtistName(
  artist: string | { name?: string; "#text"?: string } | undefined,
): string {
  if (!artist) return "";
  if (typeof artist === "string") return artist.trim();
  return (artist.name ?? artist["#text"] ?? "").trim();
}

/** Highest-quality Last.fm album/artist image → absolute https URL. */
function pickImageUrl(images: LastfmImage[] | undefined): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;

  const normalize = (raw: string): string | null => {
    const url = raw.trim();
    if (!url) return null;
    // Skip Last.fm's generic star placeholder.
    if (url.includes("2a96cbd8b46e442fc41c2b86b821562f")) return null;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("https://") || url.startsWith("http://")) return url;
    return null;
  };

  // Prefer largest artwork first.
  const preferred = ["mega", "extralarge", "large", "medium", "small"];
  for (const size of preferred) {
    const match = images.find((image) => image.size === size);
    const url = normalize(match?.["#text"] ?? match?.text ?? "");
    if (url) return url;
  }

  for (const image of [...images].reverse()) {
    const url = normalize(image["#text"] ?? image.text ?? "");
    if (url) return url;
  }
  return null;
}

function coercePositiveNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function pickWikiSummary(wiki: LastfmAlbumInfo["wiki"]): string {
  const raw = wiki?.summary?.trim() || wiki?.content?.trim() || "";
  if (!raw) return "";
  // Last.fm wiki summaries often append a "Read more on Last.fm" link.
  return raw.replace(/<a[\s\S]*$/i, "").replace(/<[^>]+>/g, "").trim();
}

function pickTags(info: LastfmAlbumInfo): string[] {
  const raw =
    info.toptags?.tag ??
    info.tags?.tag ??
    undefined;
  return asArray(raw)
    .map((tag) => tag.name?.trim())
    .filter((name): name is string => Boolean(name))
    .slice(0, 8);
}

function pickReleaseYear(releasedate: string | undefined): string | undefined {
  const raw = releasedate?.trim();
  if (!raw) return undefined;
  const year = raw.match(/(19|20)\d{2}/)?.[0];
  return year ?? undefined;
}

function preferRemoteCovers(works: Work[]): Work[] {
  const withCover = works.filter(
    (work) =>
      work.coverUrl.startsWith("https://") ||
      work.coverUrl.startsWith("http://"),
  );
  return withCover.length >= Math.min(4, works.length) ? withCover : works;
}

/** Map a Last.fm album hit → MuseLog Work. */
export function mapLastfmAlbumToWork(album: LastfmAlbumHit): Work | null {
  const title = album.name?.trim();
  const creator = pickArtistName(album.artist);
  if (!title || !creator) return null;

  const mbid = album.mbid?.trim();
  const externalId = mbid || `${creator}::${title}`;
  const listeners = coercePositiveNumber(album.listeners);
  const playcount = coercePositiveNumber(album.playcount);

  return createImportedWork({
    id: lastfmWorkId("album", externalId),
    type: "music",
    title,
    creator,
    coverUrl: pickImageUrl(album.image),
    description: "",
    genres: [],
    source: LASTFM_SOURCE,
    externalId,
    metadata: {
      provider: LASTFM_SOURCE,
      kind: "album",
      mbid: mbid || undefined,
      url: album.url,
      listeners: listeners ?? undefined,
      playcount: playcount ?? undefined,
    },
  });
}

/** Map a Last.fm track hit → MuseLog Work. */
export function mapLastfmTrackToWork(track: LastfmTrackHit): Work | null {
  const title = track.name?.trim();
  const creator = pickArtistName(track.artist);
  if (!title || !creator) return null;

  const mbid = track.mbid?.trim();
  const externalId = mbid || `${creator}::${title}`;
  const listeners = coercePositiveNumber(track.listeners);
  const playcount = coercePositiveNumber(track.playcount);

  return createImportedWork({
    id: lastfmWorkId("track", externalId),
    type: "music",
    title,
    creator,
    coverUrl: pickImageUrl(track.image),
    description: "",
    genres: [],
    source: LASTFM_SOURCE,
    externalId,
    metadata: {
      provider: LASTFM_SOURCE,
      kind: "track",
      mbid: mbid || undefined,
      url: track.url,
      listeners: listeners ?? undefined,
      playcount: playcount ?? undefined,
    },
  });
}

/** Map a Last.fm artist hit → MuseLog Work. */
export function mapLastfmArtistToWork(artist: LastfmArtistHit): Work | null {
  const title = artist.name?.trim();
  if (!title) return null;

  const mbid = artist.mbid?.trim();
  const externalId = mbid || title;
  const listeners = coercePositiveNumber(artist.listeners);

  return createImportedWork({
    id: lastfmWorkId("artist", externalId),
    type: "music",
    title,
    creator: title,
    coverUrl: pickImageUrl(artist.image),
    description: "",
    genres: [],
    source: LASTFM_SOURCE,
    externalId,
    metadata: {
      provider: LASTFM_SOURCE,
      kind: "artist",
      mbid: mbid || undefined,
      url: artist.url,
      listeners: listeners ?? undefined,
    },
  });
}

function dedupeWorks(works: Work[]): Work[] {
  const byId = new Map<string, Work>();
  for (const work of works) {
    if (!byId.has(work.id)) byId.set(work.id, work);
  }
  return Array.from(byId.values());
}

async function searchAlbums(query: string, limit: number): Promise<Work[]> {
  const response = await lastfmFetch("album.search", {
    album: query,
    limit,
  });
  const payload = (await response.json()) as {
    results?: { albummatches?: { album?: LastfmAlbumHit | LastfmAlbumHit[] } };
    error?: number;
    message?: string;
  };
  if (payload.error) {
    throw new LastfmFetchError(
      payload.message || `Last.fm error ${payload.error}`,
      "album.search",
    );
  }
  return asArray(payload.results?.albummatches?.album)
    .map(mapLastfmAlbumToWork)
    .filter((work): work is Work => Boolean(work));
}

async function searchArtists(query: string, limit: number): Promise<Work[]> {
  const response = await lastfmFetch("artist.search", {
    artist: query,
    limit,
  });
  const payload = (await response.json()) as {
    results?: {
      artistmatches?: { artist?: LastfmArtistHit | LastfmArtistHit[] };
    };
    error?: number;
    message?: string;
  };
  if (payload.error) {
    throw new LastfmFetchError(
      payload.message || `Last.fm error ${payload.error}`,
      "artist.search",
    );
  }
  return asArray(payload.results?.artistmatches?.artist)
    .map(mapLastfmArtistToWork)
    .filter((work): work is Work => Boolean(work));
}

async function searchTracks(query: string, limit: number): Promise<Work[]> {
  const response = await lastfmFetch("track.search", {
    track: query,
    limit,
  });
  const payload = (await response.json()) as {
    results?: { trackmatches?: { track?: LastfmTrackHit | LastfmTrackHit[] } };
    error?: number;
    message?: string;
  };
  if (payload.error) {
    throw new LastfmFetchError(
      payload.message || `Last.fm error ${payload.error}`,
      "track.search",
    );
  }
  return asArray(payload.results?.trackmatches?.track)
    .map(mapLastfmTrackToWork)
    .filter((work): work is Work => Boolean(work));
}

/**
 * Search Last.fm albums / artists / tracks → MuseLog Work[].
 * Albums preferred first (best cultural “work” unit + covers).
 */
export async function searchMusic(
  query: string,
  limit = 12,
): Promise<Work[]> {
  const trimmed = query.trim();
  if (!trimmed || limit < 1) return [];

  const perSource = Math.min(Math.max(limit, 1), 30);
  const [albums, tracks, artists] = await Promise.all([
    searchAlbums(trimmed, perSource),
    searchTracks(trimmed, perSource),
    searchArtists(trimmed, Math.min(perSource, 8)),
  ]);

  // Prefer album hits with remote covers, then tracks, then artists.
  const ranked = preferRemoteCovers([
    ...albums,
    ...tracks,
    ...artists,
  ]);

  return dedupeWorks(ranked).slice(0, Math.min(limit, 40));
}

async function getTopAlbumsByTag(
  tag: string,
  limit: number,
): Promise<Work[]> {
  const response = await lastfmFetch("tag.getTopAlbums", {
    tag,
    limit,
  });
  const payload = (await response.json()) as {
    albums?: { album?: LastfmAlbumHit | LastfmAlbumHit[] };
    error?: number;
    message?: string;
  };
  if (payload.error) {
    throw new LastfmFetchError(
      payload.message || `Last.fm error ${payload.error}`,
      "tag.getTopAlbums",
    );
  }
  return asArray(payload.albums?.album)
    .map(mapLastfmAlbumToWork)
    .filter((work): work is Work => Boolean(work));
}

async function getChartTopTracks(limit: number): Promise<Work[]> {
  const response = await lastfmFetch("chart.getTopTracks", { limit });
  const payload = (await response.json()) as {
    tracks?: { track?: LastfmTrackHit | LastfmTrackHit[] };
    error?: number;
    message?: string;
  };
  if (payload.error) {
    throw new LastfmFetchError(
      payload.message || `Last.fm error ${payload.error}`,
      "chart.getTopTracks",
    );
  }
  return asArray(payload.tracks?.track)
    .map(mapLastfmTrackToWork)
    .filter((work): work is Work => Boolean(work));
}

async function getChartTopArtists(limit: number): Promise<Work[]> {
  const response = await lastfmFetch("chart.getTopArtists", { limit });
  const payload = (await response.json()) as {
    artists?: { artist?: LastfmArtistHit | LastfmArtistHit[] };
    error?: number;
    message?: string;
  };
  if (payload.error) {
    throw new LastfmFetchError(
      payload.message || `Last.fm error ${payload.error}`,
      "chart.getTopArtists",
    );
  }
  return asArray(payload.artists?.artist)
    .map(mapLastfmArtistToWork)
    .filter((work): work is Work => Boolean(work));
}

/** Popular music on Last.fm (tag albums + chart tracks). */
export async function getPopularMusic(limit = 24): Promise<Work[]> {
  const attempts: Array<() => Promise<Work[]>> = [
    async () => preferRemoteCovers(await getTopAlbumsByTag("pop", limit)),
    async () => preferRemoteCovers(await getChartTopTracks(limit)),
    () => searchMusic("best albums", limit),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const items = await attempt();
      if (items.length > 0) return items.slice(0, Math.min(limit, 40));
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return [];
}

/** Trending / charting music on Last.fm. */
export async function getTrendingMusic(limit = 24): Promise<Work[]> {
  const attempts: Array<() => Promise<Work[]>> = [
    async () => preferRemoteCovers(await getChartTopTracks(limit)),
    async () => preferRemoteCovers(await getChartTopArtists(limit)),
    async () => preferRemoteCovers(await getTopAlbumsByTag("indie", limit)),
    () => searchMusic("new music", limit),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const items = await attempt();
      if (items.length > 0) return items.slice(0, Math.min(limit, 40));
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return [];
}

/**
 * Fill missing description / genres / release year from album.getInfo.
 * Only applies to album-kind Works.
 */
export async function enrichLastfmWork(work: Work): Promise<Work> {
  if (work.metadata?.kind !== "album") return work;
  const needsDescription = !work.description.trim();
  const needsGenres = work.genres.length === 0;
  const needsRelease = !work.releaseDate?.trim();
  const needsCover =
    !work.coverUrl.startsWith("https://") &&
    !work.coverUrl.startsWith("http://");
  if (!needsDescription && !needsGenres && !needsRelease && !needsCover) {
    return work;
  }

  const artist = work.creator.trim();
  const album = work.title.trim();
  if (!artist || !album) return work;

  try {
    const response = await lastfmFetch(
      "album.getInfo",
      {
        artist,
        album,
        autocorrect: 1,
      },
      { cache: "force-cache" },
    );
    const payload = (await response.json()) as {
      album?: LastfmAlbumInfo;
      error?: number;
    };
    if (payload.error || !payload.album) return work;

    const info = payload.album;
    const description = pickWikiSummary(info.wiki) || work.description;
    const genres = pickTags(info);
    const releaseDate =
      pickReleaseYear(info.releasedate) || work.releaseDate;
    const coverFromInfo = pickImageUrl(info.image);
    const hasRemoteCover =
      work.coverUrl.startsWith("https://") ||
      work.coverUrl.startsWith("http://");
    const coverUrl =
      hasRemoteCover || !coverFromInfo ? work.coverUrl : coverFromInfo;
    const listeners =
      coercePositiveNumber(info.listeners) ??
      coercePositiveNumber(work.metadata?.listeners);
    const playcount =
      coercePositiveNumber(info.playcount) ??
      coercePositiveNumber(work.metadata?.playcount);

    return {
      ...work,
      description,
      genres: genres.length > 0 ? genres : work.genres,
      releaseDate,
      coverUrl,
      metadata: {
        ...work.metadata,
        listeners: listeners ?? undefined,
        playcount: playcount ?? undefined,
        mbid: info.mbid?.trim() || work.metadata?.mbid,
        url: info.url || work.metadata?.url,
      },
    };
  } catch {
    return work;
  }
}

export async function enrichLastfmWorks(
  works: Work[],
  limit = 12,
): Promise<Work[]> {
  const targets = works.slice(0, limit);
  const enriched = await Promise.all(
    targets.map((work) => enrichLastfmWork(work)),
  );
  const byId = new Map(enriched.map((work) => [work.id, work]));
  return works.map((work) => byId.get(work.id) ?? work);
}

/** Reliable album searches when charts fail. */
export async function getExploreBootstrapMusic(
  limitPerQuery = 4,
): Promise<Work[]> {
  const queries = [
    "Carrie & Lowell",
    "Blonde Frank Ocean",
    "For Emma Forever Ago",
    "In Rainbows",
    "Kind of Blue",
    "Blue Train",
    "Discovery Daft Punk",
    "Random Access Memories",
    "To Pimp a Butterfly",
    "Channel Orange",
  ];

  const tagBatches = await Promise.all(
    ["alternative", "pop", "indie", "jazz", "electronic"].map((tag) =>
      getTopAlbumsByTag(tag, 8).catch(() => [] as Work[]),
    ),
  );

  const batches = await Promise.all(
    queries.map((query) => searchMusic(query, limitPerQuery)),
  );
  const byId = new Map<string, Work>();
  for (const work of [...batches.flat(), ...tagBatches.flat()]) {
    if (!byId.has(work.id)) byId.set(work.id, work);
  }
  return enrichLastfmWorks(
    preferRemoteCovers(Array.from(byId.values())),
    24,
  );
}

export type MusicDiscoverMode =
  | "popular"
  | "trending"
  | "bootstrap"
  | "category";

/** Albums / tracks for a Last.fm tag (genre). */
export async function getMusicByCategory(
  category: string,
  limit = 24,
): Promise<Work[]> {
  const tag = category.trim().toLowerCase();
  if (!tag) return [];

  const attempts: Array<() => Promise<Work[]>> = [
    async () => preferRemoteCovers(await getTopAlbumsByTag(tag, limit)),
    () => searchMusic(tag, limit),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const items = await attempt();
      if (items.length > 0) return items.slice(0, Math.min(limit, 40));
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return [];
}

/** Discover Last.fm music feeds → Work[]. */
export async function discoverMusic(
  mode: MusicDiscoverMode = "popular",
  limit = 24,
  category = "",
): Promise<Work[]> {
  if (mode === "trending") return getTrendingMusic(limit);
  if (mode === "bootstrap") return getExploreBootstrapMusic(4);
  if (mode === "category") return getMusicByCategory(category, limit);
  return getPopularMusic(limit);
}

/**
 * Last.fm music service — WorkMediaService contract.
 */
export const musicService: MusicService = {
  async list(): Promise<WorkListResult> {
    const items = await getPopularMusic(24);
    return { items };
  },

  async getById(): Promise<Work | null> {
    return null;
  },

  async search(query: string, limit?: number): Promise<Work[]> {
    return searchMusic(query, limit);
  },
};
