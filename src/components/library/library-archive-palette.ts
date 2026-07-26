/** Cool muted archive palette for Library covers and tags. */
export const LIBRARY_ARCHIVE = {
  steel: "#6D8FA3",
  mist: "#93ACAA",
  sage: "#6E8682",
  forest: "#455A4F",
  softMint: "#7AD9BD",
  softBlueGrey: "#718096",
  navy: "#0B1219",
  ink: "#F2F5F4",
} as const;

export const LIBRARY_COVER_COLORS = [
  LIBRARY_ARCHIVE.steel,
  LIBRARY_ARCHIVE.mist,
  LIBRARY_ARCHIVE.sage,
  LIBRARY_ARCHIVE.forest,
  LIBRARY_ARCHIVE.softBlueGrey,
] as const;

export const LIBRARY_TAG_COLORS = [
  LIBRARY_ARCHIVE.mist,
  LIBRARY_ARCHIVE.sage,
  LIBRARY_ARCHIVE.steel,
  LIBRARY_ARCHIVE.softMint,
] as const;

export const PAPER_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.2'/%3E%3C/svg%3E\")";

export function archiveColorFromSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return LIBRARY_COVER_COLORS[hash % LIBRARY_COVER_COLORS.length];
}

export function isGradientCover(cover: string): boolean {
  return (
    cover.includes("from-") ||
    cover.includes("via-") ||
    cover.includes("to-") ||
    cover.includes("gradient")
  );
}

export function isImageCover(cover: string): boolean {
  return (
    cover.startsWith("http://") ||
    cover.startsWith("https://") ||
    cover.startsWith("/") ||
    cover.startsWith("data:")
  );
}
