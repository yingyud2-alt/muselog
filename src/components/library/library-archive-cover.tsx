import {
  PAPER_GRAIN,
  archiveColorFromSeed,
  isGradientCover,
  isImageCover,
} from "@/components/library/library-archive-palette";
import { cn } from "@/lib/utils";

type LibraryArchiveCoverProps = {
  cover: string;
  title: string;
  className?: string;
};

/**
 * Premium archive cover — solid muted card for missing art,
 * real image when available. No neon / warm gradients.
 */
export function LibraryArchiveCover({
  cover,
  title,
  className,
}: LibraryArchiveCoverProps) {
  if (isImageCover(cover) && !isGradientCover(cover)) {
    return (
      <div
        className={cn(
          "relative aspect-[2/3] w-full overflow-hidden rounded-[14px]",
          "bg-[#101820] shadow-[0_6px_18px_rgba(0,0,0,0.28)] ring-1 ring-white/10",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <span className="sr-only">{title} cover</span>
      </div>
    );
  }

  const background = archiveColorFromSeed(title || cover);

  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-[14px]",
        "shadow-[0_4px_14px_rgba(0,0,0,0.28)] ring-1 ring-black/20",
        className,
      )}
      style={{
        backgroundColor: background,
        backgroundImage: PAPER_GRAIN,
        backgroundBlendMode: "multiply",
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.16), transparent 45%, rgba(0,0,0,0.18))",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="line-clamp-3 font-display text-[11px] font-bold leading-snug tracking-[0.02em] text-white/78">
          {title}
        </p>
      </div>
      <span className="sr-only">{title} cover</span>
    </div>
  );
}
