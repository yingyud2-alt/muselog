import { cn } from "@/lib/utils";

import type { Content } from "@/lib/content/types";

type ContentCoverImageProps = {
  content: Pick<Content, "title" | "cover">;
  className?: string;
  variant?: "card" | "detail" | "list";
};

export function ContentCoverImage({
  content,
  className,
  variant = "card",
}: ContentCoverImageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br shadow-sm ring-1 ring-white/10",
        variant === "card" && "aspect-[2/3] w-full",
        variant === "detail" && "aspect-[2/3] w-full max-w-[220px]",
        variant === "list" && "aspect-[5/3] w-full",
        content.cover,
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-white/5" />
      {variant !== "list" && (
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
