import { cn } from "@/lib/utils";

type LibraryMoodTagsProps = {
  tags: string[];
  className?: string;
};

/** Editorial archive mood labels — quiet metadata, not color chips. */
export function LibraryMoodTags({ tags, className }: LibraryMoodTagsProps) {
  if (tags.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <li
          key={tag}
          className={cn(
            "inline-flex items-center rounded-full bg-transparent px-3.5 py-1.5",
            "border border-[rgba(255,255,255,0.18)] font-label text-[11px] font-semibold lowercase",
            "tracking-[0.06em] text-white/88",
            "transition-[border-color] duration-200 hover:border-[rgba(255,255,255,0.32)]",
          )}
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}
