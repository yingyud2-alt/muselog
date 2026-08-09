import {
  createImportedWork,
  tmdbWorkId,
} from "@/lib/work/create-imported-work";
import type { MovieService } from "@/services/api/media-service-types";
import type { Work, WorkListResult } from "@/services/types/work";

export const TMDB_SOURCE = "tmdb";

const TMDB_TIMEOUT_MS = 15_000;
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

/** Thrown when TMDB HTTP fails — routes surface this in development. */
export class TmdbFetchError extends Error {
  readonly code = "tmdb_fetch_failed" as const;
  readonly url: string;
  readonly status?: number;

  constructor(message: string, url: string, status?: number) {
    super(message);
    this.name = "TmdbFetchError";
    this.url = url;
    this.status = status;
  }
}

/** Thrown when TMDB_API_KEY is missing on the server. */
export class TmdbConfigError extends Error {
  readonly code = "tmdb_config_missing" as const;

  constructor(message = "TMDB_API_KEY is not configured") {
    super(message);
    this.name = "TmdbConfigError";
  }
}

/** Base URL for TMDB v3 — override via TMDB_API_URL. */
export function getTmdbApiUrl(): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.TMDB_API_URL?.trim()
      : undefined;
  return fromEnv && fromEnv.length > 0
    ? fromEnv.replace(/\/$/, "")
    : "https://api.themoviedb.org/3";
}

/** Server-side API key only — never expose via NEXT_PUBLIC_*. */
export function getTmdbApiKey(): string {
  const key =
    typeof process !== "undefined" ? process.env.TMDB_API_KEY?.trim() : "";
  return key ?? "";
}

let cachedProxyUrl: string | null | undefined;

/**
 * Resolve outbound proxy for server-side TMDB calls.
 * Same rationale as Open Library: Node may need SOCKS while the browser does not.
 * Isolated from book-service — does not import Open Library helpers.
 */
async function resolveOutboundProxyUrl(): Promise<string | null> {
  if (cachedProxyUrl !== undefined) return cachedProxyUrl;

  const fromEnv =
    process.env.TMDB_PROXY?.trim() ||
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

function tmdbHeaders(): Record<string, string> {
  return {
    Accept: "application/json",
    "Accept-Language": "en",
  };
}

/** Fetch via node:https + SOCKS agent when a system proxy is present. */
async function tmdbFetchViaAgent(
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
        headers: tmdbHeaders(),
        agent,
        timeout: TMDB_TIMEOUT_MS,
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
        new TmdbFetchError(
          `TMDB request timed out after ${TMDB_TIMEOUT_MS}ms`,
          url,
        ),
      );
    });
    req.on("error", (error) => {
      reject(
        new TmdbFetchError(error.message || "TMDB socket error", url),
      );
    });
    req.end();
  });
}

/**
 * Robust server-side TMDB request.
 * Requires TMDB_API_KEY. Timeout + optional SOCKS proxy (isolated from OL).
 */
async function tmdbFetch(
  pathWithQuery: string,
  options: { cache?: RequestCache } = {},
): Promise<Response> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) {
    throw new TmdbConfigError();
  }

  try {
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  } catch {
    // Non-Node runtimes ignore this.
  }

  const url = new URL(
    pathWithQuery.startsWith("http")
      ? pathWithQuery
      : `${getTmdbApiUrl()}${pathWithQuery.startsWith("/") ? "" : "/"}${pathWithQuery}`,
  );
  if (!url.searchParams.has("api_key")) {
    url.searchParams.set("api_key", apiKey);
  }

  const href = url.toString();
  const redactedUrl = href.replaceAll(apiKey, "***");
  const proxyUrl = await resolveOutboundProxyUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TMDB_TIMEOUT_MS);

  try {
    let response: Response;

    if (proxyUrl) {
      response = await tmdbFetchViaAgent(href, proxyUrl);
    } else {
      let dispatcher: unknown;
      try {
        const undici = await import("undici");
        dispatcher = new undici.Agent({
          connectTimeout: TMDB_TIMEOUT_MS,
          headersTimeout: TMDB_TIMEOUT_MS,
          bodyTimeout: TMDB_TIMEOUT_MS,
          connect: { timeout: TMDB_TIMEOUT_MS, family: 4 },
        });
      } catch {
        dispatcher = undefined;
      }

      response = await fetch(href, {
        method: "GET",
        headers: tmdbHeaders(),
        signal: controller.signal,
        cache: options.cache ?? "no-store",
        redirect: "follow",
        ...(dispatcher ? { dispatcher } : {}),
      } as RequestInit);
    }

    if (!response.ok) {
      throw new TmdbFetchError(
        `TMDB HTTP ${response.status}`,
        redactedUrl,
        response.status,
      );
    }

    return response;
  } catch (error) {
    if (error instanceof TmdbFetchError) throw error;
    if (error instanceof TmdbConfigError) throw error;

    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? `TMDB request timed out after ${TMDB_TIMEOUT_MS}ms`
          : error.message
        : String(error);

    throw new TmdbFetchError(message, redactedUrl);
  } finally {
    clearTimeout(timer);
  }
}

/** TMDB movie genre id → name (subset used for search/discover mapping). */
export const TMDB_MOVIE_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

/** Map MuseLog / explore category labels → TMDB genre ids. */
const CATEGORY_TO_GENRE_ID: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  "science fiction": 878,
  "sci-fi": 878,
  scifi: 878,
  thriller: 53,
  war: 10752,
  western: 37,
};

/**
 * Raw TMDB movie list/search result shape (subset).
 */
export type TmdbMovieResult = {
  id?: number;
  title?: string;
  original_title?: string;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  genre_ids?: number[];
  genres?: Array<{ id?: number; name?: string }>;
  vote_average?: number | null;
  vote_count?: number | null;
  original_language?: string | null;
  popularity?: number | null;
  adult?: boolean;
};

type TmdbPagedResponse = {
  page?: number;
  results?: TmdbMovieResult[];
  total_results?: number;
};

type TmdbMovieDetail = TmdbMovieResult & {
  /** Length in minutes from GET /movie/{id}. */
  runtime?: number | null;
  credits?: {
    crew?: Array<{
      job?: string;
      name?: string;
      department?: string;
    }>;
  };
};

function pickRuntimeMinutes(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  return undefined;
}

/**
 * Map TMDB poster_path → remote cover URL.
 * Missing / null / empty path → null (caller uses placeholder via createImportedWork).
 * Never builds broken URLs like `.../w500null`.
 */
export function buildTmdbPosterUrl(
  posterPath: string | null | undefined,
): string | null {
  if (typeof posterPath !== "string") return null;
  const trimmed = posterPath.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  // Reject obviously invalid paths.
  if (path.includes("null") && path.length < 12) return null;

  return `${TMDB_IMAGE_BASE}${path}`;
}

function genreNamesFromResult(movie: TmdbMovieResult): string[] {
  if (Array.isArray(movie.genres) && movie.genres.length > 0) {
    return movie.genres
      .map((genre) => genre.name?.trim())
      .filter((name): name is string => Boolean(name))
      .slice(0, 8);
  }

  if (!Array.isArray(movie.genre_ids)) return [];
  return movie.genre_ids
    .map((id) => TMDB_MOVIE_GENRES[id])
    .filter((name): name is string => Boolean(name))
    .slice(0, 8);
}

function pickDirector(detail: TmdbMovieDetail): string | null {
  const crew = detail.credits?.crew;
  if (!Array.isArray(crew)) return null;
  const director = crew.find(
    (member) => member.job?.trim().toLowerCase() === "director",
  );
  const name = director?.name?.trim();
  return name || null;
}

/** Prefer works with real poster URLs when enough exist. */
function preferRemoteCovers(works: Work[]): Work[] {
  const withCover = works.filter(
    (work) =>
      work.coverUrl.startsWith("https://") ||
      work.coverUrl.startsWith("http://"),
  );
  return withCover.length >= Math.min(6, works.length) ? withCover : works;
}

/**
 * Map a TMDB movie result → MuseLog Work.
 * Uses createImportedWork — missing poster → placeholder, never a broken URL.
 * Does not overwrite an existing remote coverUrl on the Work (mapping is fresh).
 */
export function mapTmdbMovieToWork(
  movie: TmdbMovieResult,
  options: { creator?: string | null } = {},
): Work | null {
  const id = typeof movie.id === "number" && Number.isFinite(movie.id)
    ? movie.id
    : null;
  if (id == null) return null;

  const title = movie.title?.trim() || movie.original_title?.trim();
  if (!title) return null;

  const coverUrl = buildTmdbPosterUrl(movie.poster_path);
  const voteAverage =
    typeof movie.vote_average === "number" &&
    Number.isFinite(movie.vote_average) &&
    movie.vote_average > 0
      ? Math.round(movie.vote_average * 10) / 10
      : null;
  const voteCount =
    typeof movie.vote_count === "number" &&
    Number.isFinite(movie.vote_count) &&
    movie.vote_count > 0
      ? Math.floor(movie.vote_count)
      : null;

  const releaseDate = movie.release_date?.trim() || undefined;
  const creator = options.creator?.trim() || "Unknown";

  return createImportedWork({
    id: tmdbWorkId(id),
    type: "movie",
    title,
    creator,
    coverUrl,
    description: movie.overview?.trim() || "",
    releaseDate,
    genres: genreNamesFromResult(movie),
    source: TMDB_SOURCE,
    externalId: String(id),
    externalRatings:
      voteAverage != null
        ? [
            {
              source: TMDB_SOURCE,
              value: voteAverage,
              scale: 10,
              count: voteCount ?? undefined,
            },
          ]
        : undefined,
    metadata: {
      provider: TMDB_SOURCE,
      tmdbId: id,
      posterPath: movie.poster_path ?? undefined,
      backdropPath: movie.backdrop_path ?? undefined,
      originalLanguage: movie.original_language ?? undefined,
      popularity: movie.popularity ?? undefined,
      genreIds: movie.genre_ids,
      runtime: pickRuntimeMinutes(
        (movie as TmdbMovieDetail).runtime,
      ),
    },
  });
}

function mapResultsToWorks(results: TmdbMovieResult[]): Work[] {
  const works: Work[] = [];
  const seen = new Set<string>();

  for (const movie of results) {
    const work = mapTmdbMovieToWork(movie);
    if (!work || seen.has(work.id)) continue;
    seen.add(work.id);
    works.push(work);
  }

  return works;
}

async function parseTmdbPagedResults(
  response: Response,
): Promise<TmdbMovieResult[]> {
  const payload = (await response.json()) as TmdbPagedResponse;
  return Array.isArray(payload.results) ? payload.results : [];
}

const SEARCH_MIN_VOTE_COUNT = 20;
/** Drop near-zero TMDB popularity noise (docs / unrelated hits). */
const SEARCH_MIN_POPULARITY = 1.5;

function normalizeSearchTitle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isExactTitleMatch(movie: TmdbMovieResult, query: string): boolean {
  const q = normalizeSearchTitle(query);
  if (!q) return false;
  const title = normalizeSearchTitle(movie.title ?? "");
  const original = normalizeSearchTitle(movie.original_title ?? "");
  return title === q || original === q;
}

/**
 * Filter low-quality TMDB search hits, then rank:
 * 1) exact title match
 * 2) higher popularity
 * 3) higher vote_count
 * If every hit fails quality gates, keep the raw list (ranked) so obscure titles still resolve.
 */
function filterAndRankSearchResults(
  results: TmdbMovieResult[],
  query: string,
): TmdbMovieResult[] {
  const quality = results.filter((movie) => {
    const votes =
      typeof movie.vote_count === "number" && Number.isFinite(movie.vote_count)
        ? movie.vote_count
        : 0;
    const popularity =
      typeof movie.popularity === "number" && Number.isFinite(movie.popularity)
        ? movie.popularity
        : 0;
    return votes >= SEARCH_MIN_VOTE_COUNT && popularity >= SEARCH_MIN_POPULARITY;
  });

  const pool = quality.length > 0 ? quality : results;

  return [...pool].sort((left, right) => {
    const leftExact = isExactTitleMatch(left, query) ? 1 : 0;
    const rightExact = isExactTitleMatch(right, query) ? 1 : 0;
    if (leftExact !== rightExact) return rightExact - leftExact;

    const leftPop =
      typeof left.popularity === "number" ? left.popularity : 0;
    const rightPop =
      typeof right.popularity === "number" ? right.popularity : 0;
    if (rightPop !== leftPop) return rightPop - leftPop;

    const leftVotes =
      typeof left.vote_count === "number" ? left.vote_count : 0;
    const rightVotes =
      typeof right.vote_count === "number" ? right.vote_count : 0;
    return rightVotes - leftVotes;
  });
}

/**
 * Search TMDB movies → MuseLog Work[].
 * Does not create user status / rating / journal data.
 */
export async function searchMovies(
  query: string,
  limit = 12,
): Promise<Work[]> {
  const trimmed = query.trim();
  if (!trimmed || limit < 1) return [];

  const params = new URLSearchParams({
    query: trimmed,
    include_adult: "false",
    language: "en-US",
    page: "1",
  });

  const response = await tmdbFetch(`/search/movie?${params.toString()}`, {
    cache: "no-store",
  });
  const results = await parseTmdbPagedResults(response);
  const ranked = filterAndRankSearchResults(results, trimmed);
  return mapResultsToWorks(ranked).slice(0, Math.min(limit, 40));
}

/** Movies trending this week on TMDB. */
export async function getTrendingMovies(limit = 24): Promise<Work[]> {
  const attempts: Array<() => Promise<Work[]>> = [
    async () => {
      const response = await tmdbFetch("/trending/movie/week?language=en-US", {
        cache: "no-store",
      });
      const results = await parseTmdbPagedResults(response);
      return preferRemoteCovers(mapResultsToWorks(results)).slice(
        0,
        Math.min(limit, 40),
      );
    },
    async () => {
      const response = await tmdbFetch("/trending/movie/day?language=en-US", {
        cache: "no-store",
      });
      const results = await parseTmdbPagedResults(response);
      return preferRemoteCovers(mapResultsToWorks(results)).slice(
        0,
        Math.min(limit, 40),
      );
    },
    () => searchMovies("cinema", limit),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const items = await attempt();
      if (items.length > 0) return items;
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return [];
}

/** Top-rated movies on TMDB. */
export async function getTopRatedMovies(limit = 24): Promise<Work[]> {
  try {
    const response = await tmdbFetch(
      "/movie/top_rated?language=en-US&page=1",
      { cache: "no-store" },
    );
    const results = await parseTmdbPagedResults(response);
    return preferRemoteCovers(mapResultsToWorks(results)).slice(
      0,
      Math.min(limit, 40),
    );
  } catch {
    return [];
  }
}

/** Now-playing / recent theatrical releases on TMDB. */
export async function getNowPlayingMovies(limit = 24): Promise<Work[]> {
  try {
    const response = await tmdbFetch(
      "/movie/now_playing?language=en-US&page=1",
      { cache: "no-store" },
    );
    const results = await parseTmdbPagedResults(response);
    return preferRemoteCovers(mapResultsToWorks(results)).slice(
      0,
      Math.min(limit, 40),
    );
  } catch {
    return [];
  }
}

/** Popular movies on TMDB. */
export async function getPopularMovies(limit = 24): Promise<Work[]> {
  const attempts: Array<() => Promise<Work[]>> = [
    async () => {
      const response = await tmdbFetch("/movie/popular?language=en-US&page=1", {
        cache: "no-store",
      });
      const results = await parseTmdbPagedResults(response);
      return preferRemoteCovers(mapResultsToWorks(results)).slice(
        0,
        Math.min(limit, 40),
      );
    },
    async () => {
      const response = await tmdbFetch(
        "/movie/top_rated?language=en-US&page=1",
        { cache: "no-store" },
      );
      const results = await parseTmdbPagedResults(response);
      return preferRemoteCovers(mapResultsToWorks(results)).slice(
        0,
        Math.min(limit, 40),
      );
    },
    () => searchMovies("best films", limit),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const items = await attempt();
      if (items.length > 0) return items;
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return [];
}

function resolveGenreId(category: string): number | null {
  const key = category.trim().toLowerCase();
  if (!key) return null;
  if (CATEGORY_TO_GENRE_ID[key] != null) return CATEGORY_TO_GENRE_ID[key];
  // Allow raw numeric genre ids.
  const asNumber = Number(key);
  if (Number.isFinite(asNumber) && TMDB_MOVIE_GENRES[asNumber]) {
    return asNumber;
  }
  return null;
}

/** Movies for a TMDB genre / MuseLog category label. */
export async function getMoviesByCategory(
  category: string,
  limit = 24,
): Promise<Work[]> {
  const trimmed = category.trim();
  if (!trimmed) return [];

  const genreId = resolveGenreId(trimmed);
  const attempts: Array<() => Promise<Work[]>> = [];

  if (genreId != null) {
    attempts.push(async () => {
      const params = new URLSearchParams({
        with_genres: String(genreId),
        language: "en-US",
        sort_by: "popularity.desc",
        include_adult: "false",
        page: "1",
      });
      const response = await tmdbFetch(`/discover/movie?${params.toString()}`, {
        cache: "no-store",
      });
      const results = await parseTmdbPagedResults(response);
      return preferRemoteCovers(mapResultsToWorks(results)).slice(
        0,
        Math.min(limit, 40),
      );
    });
  }

  attempts.push(() => searchMovies(trimmed, limit));

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const items = await attempt();
      if (items.length > 0) return items;
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return [];
}

/**
 * Fill missing description / director / runtime from TMDB `/movie/{id}`.
 * Preserves an existing remote poster URL — never overwrites with placeholder.
 */
export async function enrichTmdbWork(work: Work): Promise<Work> {
  const externalId = work.externalId?.trim();
  if (!externalId) return work;

  const needsDescription = !work.description.trim();
  const needsCreator = !work.creator.trim() || work.creator === "Unknown";
  const needsGenres = work.genres.length === 0;
  const needsRuntime = pickRuntimeMinutes(work.metadata?.runtime) == null;
  if (!needsDescription && !needsCreator && !needsGenres && !needsRuntime) {
    return work;
  }

  try {
    const params = new URLSearchParams({
      language: "en-US",
      append_to_response: "credits",
    });
    const response = await tmdbFetch(
      `/movie/${encodeURIComponent(externalId)}?${params.toString()}`,
      { cache: "force-cache" },
    );
    const detail = (await response.json()) as TmdbMovieDetail;
    const director = pickDirector(detail);
    const description =
      detail.overview?.trim() || work.description;
    const genres =
      genreNamesFromResult(detail).length > 0
        ? genreNamesFromResult(detail)
        : work.genres;
    const runtime =
      pickRuntimeMinutes(detail.runtime) ??
      pickRuntimeMinutes(work.metadata?.runtime);

    // Only adopt a new poster when the Work still has a placeholder cover.
    const hasRemoteCover =
      work.coverUrl.startsWith("https://") ||
      work.coverUrl.startsWith("http://");
    const enrichedPoster = buildTmdbPosterUrl(detail.poster_path);
    const coverUrl =
      hasRemoteCover || !enrichedPoster ? work.coverUrl : enrichedPoster;

    return {
      ...work,
      description,
      creator: director || work.creator,
      genres,
      coverUrl,
      metadata: {
        ...work.metadata,
        director: director ?? undefined,
        posterPath: detail.poster_path ?? work.metadata?.posterPath,
        backdropPath: detail.backdrop_path ?? work.metadata?.backdropPath,
        runtime,
      },
    };
  } catch {
    // Enrichment is best-effort — keep the search hit as-is.
    return work;
  }
}

/** Enrich a batch (capped) so Explore cards get blurbs / directors. */
export async function enrichTmdbWorks(
  works: Work[],
  limit = 16,
): Promise<Work[]> {
  const targets = works.slice(0, limit);
  const enriched = await Promise.all(
    targets.map((work) => enrichTmdbWork(work)),
  );
  const byId = new Map(enriched.map((work) => [work.id, work]));
  return works.map((work) => byId.get(work.id) ?? work);
}

/**
 * Reliable title searches for Explore bootstrap when trending feeds fail.
 */
export async function getExploreBootstrapMovies(
  limitPerQuery = 4,
): Promise<Work[]> {
  const queries = [
    "Interstellar",
    "Inception",
    "Spirited Away",
    "Parasite",
    "The Godfather",
    "Blade Runner 2049",
    "Perfect Days",
    "Before Sunrise",
  ];

  const batches = await Promise.all(
    queries.map((query) => searchMovies(query, limitPerQuery)),
  );
  const byId = new Map<string, Work>();
  for (const work of batches.flat()) {
    if (!byId.has(work.id)) byId.set(work.id, work);
  }
  return enrichTmdbWorks(Array.from(byId.values()), 20);
}

/** Fetch a single TMDB movie by id → Work. */
export async function getMovieById(id: string): Promise<Work | null> {
  const trimmed = id.trim().replace(/^tmdb-/i, "");
  if (!trimmed) return null;

  try {
    const params = new URLSearchParams({
      language: "en-US",
      append_to_response: "credits",
    });
    const response = await tmdbFetch(
      `/movie/${encodeURIComponent(trimmed)}?${params.toString()}`,
      { cache: "force-cache" },
    );
    const detail = (await response.json()) as TmdbMovieDetail;
    const work = mapTmdbMovieToWork(detail, {
      creator: pickDirector(detail),
    });
    return work;
  } catch (error) {
    if (error instanceof TmdbFetchError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * TMDB movie service — WorkMediaService contract.
 */
export const movieService: MovieService = {
  async list(): Promise<WorkListResult> {
    const items = await getPopularMovies(24);
    return { items };
  },

  async getById(id: string): Promise<Work | null> {
    return getMovieById(id);
  },

  async search(query: string, limit?: number): Promise<Work[]> {
    return searchMovies(query, limit);
  },
};
