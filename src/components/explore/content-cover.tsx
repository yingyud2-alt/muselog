import { cn } from "@/lib/utils";

import type { Content } from "@/lib/content/types";

type ContentCoverImageProps = {
  content: Pick<Content, "title" | "cover"> & { coverUrl?: string };
  className?: string;
  /**
   * card — standard poster; compact — shorter discovery density;
   * detail / list — existing surfaces.
   */
  variant?: "card" | "compact" | "detail" | "list";
  /** When true, skip title overlay (title shown beside/below). */
  hideTitle?: boolean;
};

function isRemoteCover(cover: string): boolean {
  const value = cover.trim();
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
 * Explore cover — gradient class or remote image URL (API public catalog).
 * Prefers `coverUrl` when present so Open Library covers never lose to gradients.
 * Loading behavior unchanged — presentation variants only.
 */
export function ContentCoverImage({
  content,
  className,
  variant = "card",
  hideTitle = false,
}: ContentCoverImageProps) {
  const coverValue = content.coverUrl?.trim() || content.cover;
  const remote = isRemoteCover(coverValue);
  const showTitle =
    !hideTitle && variant !== "list" && variant !== "compact";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-white/10",
        variant === "card" && "aspect-[2/3] w-full",
        // Shorter than 2/3 poster — denser discovery feed.
        variant === "compact" && "aspect-[3/4] w-full",
        variant === "detail" && "aspect-[2/3] w-full max-w-[220px]",
        variant === "list" && "aspect-[5/3] w-full",
        !remote && "bg-gradient-to-br",
        !remote && coverValue,
        remote && "bg-[#101820]",
        className,
      )}
    >
      {remote ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverValue}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-white/5" />
      {showTitle && (
        <p
          className={cn(
            "absolute inset-x-0 bottom-0 line-clamp-3 font-medium leading-snug text-white/95",
            variant === "card" ? "p-3 text-xs" : "p-4 text-sm",
          )}
        >
          {content.title}
        </p>
      )}
    </div>
  );
}
