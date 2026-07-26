import { MuseEmptyState } from "@/components/shared/muse-empty-state";
import type { TasteTag } from "@/types/profile";
import { cn } from "@/lib/utils";

type ProfileTasteTagsProps = {
  tags: TasteTag[];
};

export function ProfileTasteTags({ tags }: ProfileTasteTagsProps) {
  return (
    <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm md:p-6">
      <h2 className="text-sm font-medium text-white/62">Your taste</h2>

      {tags.length === 0 ? (
        <MuseEmptyState
          title="Taste still forming."
          description="Keep exploring to discover the patterns in your archive."
          actionLabel="Explore titles"
          actionHref="/explore"
          className="mt-4"
        />
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
