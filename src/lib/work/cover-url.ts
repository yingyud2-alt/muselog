const DEFAULT_COVER = "from-slate-800 via-slate-900 to-black";

/** True when the value is a remote/local image URL (not a Tailwind gradient class). */
export function isRemoteCoverUrl(cover: string | null | undefined): boolean {
  const value = cover?.trim() ?? "";
  if (!value) return false;
  if (
    value.includes("from-") ||
    value.includes("via-") ||
    value.includes("to-") ||
    value.includes("gradient")
  ) {
    return false;
  }
  return (
    value.startsWith("https://") ||
    value.startsWith("http://") ||
    value.startsWith("/") ||
    value.startsWith("data:")
  );
}

/**
 * Prefer a real image URL over empty strings / gradient placeholders.
 * Used so Open Library `coverUrl` survives Library + modal adapters.
 */
export function resolveCoverUrl(
  ...candidates: Array<string | null | undefined>
): string {
  const cleaned = candidates
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  const remote = cleaned.find((value) => isRemoteCoverUrl(value));
  if (remote) return remote;

  return cleaned[0] ?? DEFAULT_COVER;
}

export { DEFAULT_COVER as FALLBACK_COVER };
