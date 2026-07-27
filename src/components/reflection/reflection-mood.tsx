import type { ReflectionMoodTag } from "@/lib/reflection/reflection-types";
import { cn } from "@/lib/utils";

const MOOD_COLORS = [
  "from-teal-500/20 to-emerald-900/30 border-teal-400/15",
  "from-cyan-500/15 to-slate-900/30 border-cyan-400/15",
  "from-amber-500/15 to-stone-900/30 border-amber-400/15",
  "from-violet-500/15 to-indigo-950/30 border-violet-400/15",
];

type ReflectionMoodProps = {
  tags: ReflectionMoodTag[];
};

export function ReflectionMood({ tags }: ReflectionMoodProps) {
  return (
    <section className="muse-dark-panel rounded-[24px] bg-white/[0.03] p-5 backdrop-blur-sm md:p-6">
      <h2 className="text-sm font-medium text-white/62">Your Mood</h2>

      {tags.length === 0 ? (
        <p className="mt-4 text-sm text-white/42">
          Journal notes and habits will reveal your mood over time.
        </p>
      ) : (
        <ul className="mt-5 flex flex-wrap gap-3">
          {tags.map((tag, index) => (
            <li
              key={tag.label}
              className={cn(
                "flex size-20 items-center justify-center rounded-full border bg-gradient-to-br",
                "text-center text-xs font-medium leading-tight text-white/75",
                "sm:size-24 sm:text-sm",
                MOOD_COLORS[index % MOOD_COLORS.length],
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
