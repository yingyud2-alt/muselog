"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  FALLBACK_COVER,
  isRemoteCoverUrl,
  normalizeWorkCoverUrl,
  resolveCoverUrl,
} from "@/lib/work/cover-url";

import type { Content } from "@/lib/content/types";

type ContentCoverImageProps = {
  content: Pick<Content, "title" | "cover"> & {
    coverUrl?: string;
    source?: string;
  };
  className?: string;
  /**
   * card — standard poster; compact — shorter discovery density;
   * detail / list — existing surfaces.
   */
  variant?: "card" | "compact" | "detail" | "list";
  /** When true, skip title overlay (title shown beside/below). */
  hideTitle?: boolean;
};

/**
 * Explore cover — prefers normalized coverUrl, then cover, then placeholder.
 */
export function ContentCoverImage({
  content,
  className,
  variant = "card",
  hideTitle = false,
}: ContentCoverImageProps) {
  const resolved = normalizeWorkCoverUrl(
    resolveCoverUrl(content.coverUrl, content.cover),
    { source: content.source },
  );
  const [failed, setFailed] = useState(false);
  const remote = !failed && isRemoteCoverUrl(resolved);
  const gradient = remote ? FALLBACK_COVER : resolved || FALLBACK_COVER;
  const showTitle =
    !hideTitle && variant !== "list" && variant !== "compact";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-white/10",
        variant === "card" && "aspect-[2/3] w-full",
        variant === "compact" && "aspect-[3/4] w-full",
        variant === "detail" && "aspect-[2/3] w-full max-w-[220px]",
        variant === "list" && "aspect-[5/3] w-full",
        !remote && "bg-gradient-to-br",
        !remote && gradient,
        remote && "bg-[#101820]",
        className,
      )}
    >
      {remote ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolved}
          alt=""
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailed(true)}
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
