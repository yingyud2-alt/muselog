import { cn } from "@/lib/utils";

type MemoryCoverProps = {
  cover: string;
  title: string;
  className?: string;
  overlay?: "soft" | "deep";
};

export function MemoryCover({
  cover,
  title,
  className,
  overlay = "soft",
}: MemoryCoverProps) {
  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-[14px]",
        "bg-gradient-to-br shadow-[0_8px_24px_rgba(0,0,0,0.22)] ring-1 ring-white/10",
        cover,
        className,
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t",
          overlay === "deep"
            ? "from-[#0D1117]/90 via-[#0D1117]/20 to-white/[0.06]"
            : "from-black/55 via-black/10 to-white/[0.05]",
        )}
      />
      <span className="sr-only">{title} cover</span>
    </div>
  );
}
