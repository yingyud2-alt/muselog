import type { TasteTag } from "@/types/profile";
import { cn } from "@/lib/utils";

type CulturalDnaProps = {
  tags: TasteTag[];
  className?: string;
};

export function CulturalDna({ tags, className }: CulturalDnaProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h2 className="text-xl font-medium tracking-tight text-white/90">
          Cultural DNA
        </h2>
        <p className="text-sm text-white/40">
          The quiet patterns running through your archive
        </p>
      </div>

      <ul className="flex flex-wrap gap-2.5">
        {tags.map((tag) => (
          <li
            key={tag.label}
            className={cn(
              "rounded-2xl border border-white/[0.1] bg-white/[0.045] px-4 py-2.5",
              "text-sm text-white/72 shadow-[0_8px_24px_rgba(0,0,0,0.16)] backdrop-blur-md",
            )}
          >
            {tag.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
