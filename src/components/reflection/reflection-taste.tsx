import type { ReflectionTasteTag } from "@/lib/reflection/reflection-types";
import { cn } from "@/lib/utils";

type ReflectionTasteProps = {
  tags: ReflectionTasteTag[];
};

export function ReflectionTaste({ tags }: ReflectionTasteProps) {
  return (
    <section className="muse-dark-panel rounded-[24px] bg-white/[0.03] p-5 backdrop-blur-sm md:p-6">
      <h2 className="text-sm font-medium text-white/62">Your Taste</h2>

      {tags.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-white/42">
          Keep exploring to discover your taste.
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag.label}
              className={cn(
                "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5",
                "text-sm text-white/68",
              )}
            >
              {tag.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
