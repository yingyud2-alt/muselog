import { isRemoteCoverUrl } from "@/lib/work/cover-url";
import { cn } from "@/lib/utils";

type MemoryCoverProps = {
  cover: string;
  title: string;
  className?: string;
  /** Applied to the artwork layer (use for hover scale). */
  imageClassName?: string;
  overlay?: "soft" | "deep" | "none";
};

/**
 * Journal cover — Work.coverUrl image, or placeholder gradient.
 */
export function MemoryCover({
  cover,
  title,
  className,
  imageClassName,
  overlay = "soft",
}: MemoryCoverProps) {
  const remote = isRemoteCoverUrl(cover);

  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-[14px]",
        "shadow-[0_8px_24px_rgba(0,0,0,0.22)] ring-1 ring-white/10",
        "bg-[#101820]",
        className,
      )}
      aria-hidden="true"
    >
      {remote ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt=""
          className={cn(
            "absolute inset-0 size-full object-cover",
            imageClassName,
          )}
        />
      ) : (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br",
            cover,
            imageClassName,
          )}
        />
      )}
      {overlay !== "none" ? (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t",
            overlay === "deep"
              ? "from-[#0D1117]/90 via-[#0D1117]/20 to-white/[0.06]"
              : "from-black/55 via-black/10 to-white/[0.05]",
          )}
        />
      ) : null}
      <span className="sr-only">{title} cover</span>
    </div>
  );
}
