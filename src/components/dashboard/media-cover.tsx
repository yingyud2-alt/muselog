import { cn } from "@/lib/utils";

type MediaCoverProps = {
  title: string;
  className?: string;
  variant?: "default" | "compact";
};

export function MediaCover({
  title,
  className,
  variant = "default",
}: MediaCoverProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-br shadow-sm ring-1 ring-black/10",
        variant === "default" ? "aspect-[2/3] w-full" : "aspect-[2/3]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-white/10" />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
      </div>
      <p
        className={cn(
          "absolute inset-x-0 bottom-0 line-clamp-3 font-medium leading-snug text-white/95",
          variant === "compact" ? "p-2.5 text-[0.65rem]" : "p-3 text-xs",
        )}
      >
        {title}
      </p>
    </div>
  );
}
