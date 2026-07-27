import { createImportedWork, openLibraryWorkId } from "@/lib/work/create-imported-work";
import type { BookService } from "@/services/api/media-service-types";
import type { Work, WorkListResult } from "@/services/types/work";

export const OPEN_LIBRARY_SOURCE = "open_library";

const OPEN_LIBRARY_USER_AGENT = "MuseLog/1.0 (contact@example.com)";
const OPEN_LIBRARY_TIMEOUT_MS = 15_000;

/** Thrown when Open Library HTTP fails — routes surface this in development. */
export class OpenLibraryFetchError extends Error {
  readonly code = "open_library_fetch_failed" as const;
  readonly url: string;
  readonly status?: number;

  constructor(message: string, url: string, status?: number) {
    super(message);
    this.name = "OpenLibraryFetchError";
    this.url = url;
    this.status = status;
  }
}

/** Base URL for Open Library — override via OPEN_LIBRARY_API_URL. */
export function getOpenLibraryApiUrl(): string {
  const fromEnv =
    typeof process !== "undefined"
      ? (
          process.env.OPEN_LIBRARY_API_URL?.trim() ||
          process.env.NEXT_PUBLIC_OPEN_LIBRARY_API_URL?.trim()
        )
      : undefined;
  return fromEnv && fromEnv.length > 0
    ? fromEnv.replace(/\/$/, "")
    : "https://openlibrary.org";
}

let cachedProxyUrl: string | null | undefined;

/**
 * Resolve outbound proxy for server-side Open Library calls.
 * Browser uses the OS SOCKS proxy; Node fetch does not — without this,
 * OL connects time out while the browser succeeds.
 */
async function resolveOutboundProxyUrl(): Promise<string | null> {
  if (cachedProxyUrl !== undefined) return cachedProxyUrl;

  const fromEnv =
    process.env.OPEN_LIBRARY_PROXY?.trim() ||
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

function openLibraryHeaders(): Record<string, string> {
  return {
    Accept: "application/json",
    "User-Agent": OPEN_LIBRARY_USER_AGENT,
    "Accept-Language": "en",
  };
}

/** Fetch via node:https + SOCKS agent (used when a system proxy is present). */
async function openLibraryFetchViaAgent(
  url: string,
  proxyUrl: string,
): Promise<Response> {
  const { request } = await import("node:https");
  const { SocksProxyAgent } = await import("socks-proxy-agent");

  // socks5h = resolve DNS through the proxy (required on this machine).
  const agent = new SocksProxyAgent(proxyUrl);

  return new Promise<Response>((resolve, reject) => {
    const req = request(
      url,
      {
        method: "GET",
        headers: openLibraryHeaders(),
        agent,
        timeout: OPEN_LIBRARY_TIMEOUT_MS,
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
        new OpenLibraryFetchError(
          `Open Library request timed out after ${OPEN_LIBRARY_TIMEOUT_MS}ms`,
          url,
        ),
      );
    });
    req.on("error", (error) => {
      reject(
        new OpenLibraryFetchError(
          error.message || "Open Library socket error",
          url,
        ),
      );
    });
    req.end();
  });
}

/**
 * Robust server-side Open Library request.
 * Browser can reach OL while bare Node fetch often times out / is throttled —
 * explicit UA + 15s abort + OS SOCKS proxy when present.
 */
async function openLibraryFetch(
  url: string,
  options: { cache?: RequestCache } = {},
): Promise<Response> {
  // Prefer IPv4 when Node dual-stack DNS stalls on IPv6 routes to OL.
  try {
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  } catch {
    // Non-Node runtimes ignore this.
  }

  const proxyUrl = await resolveOutboundProxyUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPEN_LIBRARY_TIMEOUT_MS);

  try {
    let response: Response;

    if (proxyUrl) {
      response = await openLibraryFetchViaAgent(url, proxyUrl);
    } else {
      // Raise undici connect timeout above the default 10s.
      let dispatcher: unknown;
      try {
        const undici = await import("undici");
        dispatcher = new undici.Agent({
          connectTimeout: OPEN_LIBRARY_TIMEOUT_MS,
          headersTimeout: OPEN_LIBRARY_TIMEOUT_MS,
          bodyTimeout: OPEN_LIBRARY_TIMEOUT_MS,
          connect: { timeout: OPEN_LIBRARY_TIMEOUT_MS, family: 4 },
        });
      } catch {
        dispatcher = undefined;
      }

      response = await fetch(url, {
        method: "GET",
        headers: openLibraryHeaders(),
        signal: controller.signal,
        cache: options.cache ?? "no-store",
        redirect: "follow",
        ...(dispatcher ? { dispatcher } : {}),
      } as RequestInit);
    }

    if (!response.ok) {
      throw new OpenLibraryFetchError(
        `Open Library HTTP ${response.status}`,
        url,
        response.status,
      );
    }

    return response;
  } catch (error) {
    if (error instanceof OpenLibraryFetchError) throw error;

    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? `Open Library request timed out after ${OPEN_LIBRARY_TIMEOUT_MS}ms`
          : error.message
        : String(error);

    throw new OpenLibraryFetchError(message, url);
  } finally {
    clearTimeout(timer);
  }
}

async function parseOpenLibrarySearchDocs(
  response: Response,
): Promise<OpenLibrarySearchDoc[]> {
  const payload = (await response.json()) as OpenLibrarySearchResponse;
  return Array.isArray(payload.docs) ? payload.docs : [];
}

function mapDocsToWorks(docs: OpenLibrarySearchDoc[]): Work[] {
  const works: Work[] = [];
  const seen = new Set<string>();

  for (const doc of docs) {
    const work = mapOpenLibraryDocToWork(doc);
    if (!work || seen.has(work.id)) continue;
    seen.add(work.id);
    works.push(work);
  }

  return works;
}

/**
 * Raw Open Library search doc shape (subset).
 */
export type OpenLibrarySearchDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  /** Cover id — may arrive as number or numeric string. */
  cover_i?: number | string | null;
  /** Alternate cover ids (work/edition payloads). */
  covers?: Array<number | string | null>;
  cover_edition_key?: string;
  isbn?: string[];
  first_publish_year?: number;
  first_sentence?: string | string[];
  subtitle?: string;
  subject?: string[];
  number_of_pages_median?: number;
  ratings_average?: number | string | null;
  ratings_count?: number | string | null;
};

type OpenLibrarySearchResponse = {
  numFound?: number;
  docs?: OpenLibrarySearchDoc[];
};

function pickDescription(doc: OpenLibrarySearchDoc): string {
  if (Array.isArray(doc.first_sentence)) {
    const sentence = doc.first_sentence.find((part) => part?.trim());
    if (sentence?.trim()) return sentence.trim();
  } else if (typeof doc.first_sentence === "string" && doc.first_sentence.trim()) {
    return doc.first_sentence.trim();
  }
  if (doc.subtitle?.trim()) return doc.subtitle.trim();
  return "";
}

function coercePositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  }
  return null;
}

/**
 * Map Open Library cover fields → Work.coverUrl.
 * Preferred: cover_i → https://covers.openlibrary.org/b/id/{cover_i}-L.jpg
 */
export function buildOpenLibraryCoverUrl(
  doc: Pick<
    OpenLibrarySearchDoc,
    "cover_i" | "covers" | "cover_edition_key" | "isbn"
  >,
): string | null {
  const coverId =
    coercePositiveInt(doc.cover_i) ??
    coercePositiveInt(
      Array.isArray(doc.covers)
        ? doc.covers.find((value) => coercePositiveInt(value) != null)
        : null,
    );

  if (coverId != null) {
    return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  }

  const editionKey = doc.cover_edition_key?.trim();
  if (editionKey) {
    return `https://covers.openlibrary.org/b/olid/${editionKey}-L.jpg`;
  }

  const isbn = doc.isbn?.find((value) => value?.trim())?.trim();
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }

  return null;
}

/** Map an Open Library search doc → MuseLog Work (cover → coverUrl). */
export function mapOpenLibraryDocToWork(doc: OpenLibrarySearchDoc): Work | null {
  const externalId = doc.key?.trim();
  if (!externalId) return null;

  const title = doc.title?.trim();
  if (!title) return null;

  const creator =
    doc.author_name?.find((name) => name.trim())?.trim() || "Unknown";

  const coverUrl = buildOpenLibraryCoverUrl(doc);
  const coverId = coercePositiveInt(doc.cover_i);
  const ratingsAverageRaw =
    typeof doc.ratings_average === "number"
      ? doc.ratings_average
      : typeof doc.ratings_average === "string"
        ? Number(doc.ratings_average)
        : NaN;
  const ratingsAverage =
    Number.isFinite(ratingsAverageRaw) && ratingsAverageRaw > 0
      ? ratingsAverageRaw
      : null;
  const ratingsCount = coercePositiveInt(doc.ratings_count);

  return createImportedWork({
    id: openLibraryWorkId(externalId),
    type: "book",
    title,
    creator,
    coverUrl,
    description: pickDescription(doc),
    releaseDate: doc.first_publish_year
      ? String(doc.first_publish_year)
      : undefined,
    genres: doc.subject?.slice(0, 8) ?? [],
    source: OPEN_LIBRARY_SOURCE,
    externalId,
    externalRatings:
      ratingsAverage != null
        ? [
            {
              source: OPEN_LIBRARY_SOURCE,
              value: Math.round(ratingsAverage * 100) / 100,
              scale: 5,
              count: ratingsCount ?? undefined,
            },
          ]
        : undefined,
    metadata: {
      provider: OPEN_LIBRARY_SOURCE,
      coverId: coverId ?? undefined,
      coverEditionKey: doc.cover_edition_key,
      pages: doc.number_of_pages_median,
      ratingsAverage: ratingsAverage ?? undefined,
      ratingsCount: ratingsCount ?? undefined,
    },
  });
}

const OPEN_LIBRARY_SEARCH_FIELDS = [
  "key",
  "title",
  "author_name",
  "first_publish_year",
  "cover_i",
  "covers",
  "cover_edition_key",
  "isbn",
  "first_sentence",
  "subtitle",
  "subject",
  "number_of_pages_median",
  "ratings_average",
  "ratings_count",
].join(",");

type OpenLibrarySearchOptions = {
  q?: string;
  subject?: string;
  sort?: string;
  limit?: number;
};

/**
 * Low-level Open Library search → MuseLog Work[].
 * Does not create user status / rating / journal data.
 * Throws OpenLibraryFetchError on network/HTTP failure (no silent []).
 */
export async function fetchOpenLibrarySearch(
  options: OpenLibrarySearchOptions,
): Promise<Work[]> {
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 40);
  const q = options.q?.trim() ?? "";
  const subject = options.subject?.trim() ?? "";
  if (!q && !subject) return [];

  const url = new URL(`${getOpenLibraryApiUrl()}/search.json`);
  if (q) url.searchParams.set("q", q);
  if (subject) url.searchParams.set("subject", subject);
  if (options.sort?.trim()) url.searchParams.set("sort", options.sort.trim());
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("fields", OPEN_LIBRARY_SEARCH_FIELDS);

  const href = url.toString();
  const response = await openLibraryFetch(href, { cache: "no-store" });
  const docs = await parseOpenLibrarySearchDocs(response);
  return preferRemoteCovers(mapDocsToWorks(docs));
}

/** Prefer works with real cover URLs when enough exist. */
function preferRemoteCovers(works: Work[]): Work[] {
  const withCover = works.filter((work) =>
    work.coverUrl.startsWith("https://") || work.coverUrl.startsWith("http://"),
  );
  return withCover.length >= Math.min(6, works.length) ? withCover : works;
}

/**
 * Search Open Library and return normalized MuseLog Work objects.
 * Does not create user status / rating / journal data.
 * Throws OpenLibraryFetchError on network/HTTP failure (no silent []).
 */
export async function searchBooks(
  query: string,
  limit = 12,
): Promise<Work[]> {
  const trimmed = query.trim();
  if (!trimmed || limit < 1) return [];

  const url = new URL(`${getOpenLibraryApiUrl()}/search.json`);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("limit", String(Math.min(limit, 40)));
  url.searchParams.set("fields", OPEN_LIBRARY_SEARCH_FIELDS);

  const href = url.toString();
  const response = await openLibraryFetch(href, { cache: "no-store" });
  const docs = await parseOpenLibrarySearchDocs(response);
  return mapDocsToWorks(docs);
}

/** Books currently rising on Open Library (activity z-score). */
export async function getTrendingBooks(limit = 24): Promise<Work[]> {
  const attempts: Array<() => Promise<Work[]>> = [
    () =>
      fetchOpenLibrarySearch({
        q: "language:eng",
        sort: "trending",
        limit,
      }),
    () =>
      fetchOpenLibrarySearch({
        q: "language:eng",
        sort: "readinglog",
        limit,
      }),
    () => searchBooks("contemporary literary fiction", limit),
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

/** Widely logged / popular books on Open Library. */
export async function getPopularBooks(limit = 24): Promise<Work[]> {
  const attempts: Array<() => Promise<Work[]>> = [
    () =>
      fetchOpenLibrarySearch({
        q: "language:eng",
        sort: "readinglog",
        limit,
      }),
    () =>
      fetchOpenLibrarySearch({
        q: "language:eng",
        sort: "editions",
        limit,
      }),
    () => searchBooks("best novels", limit),
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

/** Books for an Open Library subject / category (e.g. "memoir", "poetry"). */
export async function getBooksByCategory(
  category: string,
  limit = 24,
): Promise<Work[]> {
  const trimmed = category.trim();
  if (!trimmed) return [];

  const attempts: Array<() => Promise<Work[]>> = [
    () =>
      fetchOpenLibrarySearch({
        subject: trimmed,
        sort: "trending",
        limit,
      }),
    () =>
      fetchOpenLibrarySearch({
        subject: trimmed,
        sort: "readinglog",
        limit,
      }),
    () => searchBooks(`subject:${trimmed}`, limit),
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

type OpenLibraryWorkPayload = {
  description?: string | { value?: string; type?: string };
  title?: string;
};

function pickWorkDescription(payload: OpenLibraryWorkPayload): string {
  const raw = payload.description;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (raw && typeof raw === "object" && typeof raw.value === "string") {
    return raw.value.trim();
  }
  return "";
}

/**
 * Fill missing Work.description from Open Library `/works/{id}.json`.
 * Search docs often omit long blurbs; the work record usually has them.
 */
export async function enrichOpenLibraryWorkDescription(
  work: Work,
): Promise<Work> {
  if (work.description.trim()) return work;
  const externalId = work.externalId?.trim();
  if (!externalId || !externalId.includes("/works/")) return work;

  try {
    const url = `${getOpenLibraryApiUrl()}${externalId}.json`;
    const response = await openLibraryFetch(url, { cache: "force-cache" });
    const payload = (await response.json()) as OpenLibraryWorkPayload;
    const description = pickWorkDescription(payload);
    if (!description) return work;
    return { ...work, description };
  } catch {
    // Enrichment is best-effort — keep the search hit without a blurb.
    return work;
  }
}

/** Enrich a batch (capped) so Explore cards get real blurbs. */
export async function enrichOpenLibraryWorks(
  works: Work[],
  limit = 16,
): Promise<Work[]> {
  const targets = works.slice(0, limit);
  const enriched = await Promise.all(
    targets.map((work) => enrichOpenLibraryWorkDescription(work)),
  );
  const byId = new Map(enriched.map((work) => [work.id, work]));
  return works.map((work) => byId.get(work.id) ?? work);
}

/**
 * Reliable title searches for Explore bootstrap when trending feeds fail.
 * Ensures classics like Norwegian Wood come from Open Library, not mock.
 */
export async function getExploreBootstrapBooks(
  limitPerQuery = 4,
): Promise<Work[]> {
  const queries = [
    "title:\"Norwegian Wood\" author:Murakami",
    "title:\"The Little Prince\"",
    "title:\"Kafka on the Shore\"",
    "title:\"Never Let Me Go\" Ishiguro",
    "title:\"Pride and Prejudice\" Austen",
    "subject:literary fiction",
  ];

  const batches = await Promise.all(
    queries.map((query) => searchBooks(query, limitPerQuery)),
  );
  const byId = new Map<string, Work>();
  for (const work of batches.flat()) {
    if (!byId.has(work.id)) byId.set(work.id, work);
  }
  return enrichOpenLibraryWorks(Array.from(byId.values()), 20);
}

/**
 * Open Library book service — existing WorkMediaService contract.
 */
export const bookService: BookService = {
  async list(): Promise<WorkListResult> {
    const items = await getPopularBooks(24);
    return { items };
  },

  async getById(): Promise<Work | null> {
    return null;
  },

  async search(query: string, limit?: number): Promise<Work[]> {
    return searchBooks(query, limit);
  },
};
