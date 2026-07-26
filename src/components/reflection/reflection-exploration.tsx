import type { ReflectionResult } from "@/lib/reflection/reflection-types";

type ReflectionExplorationProps = {
  reflection: ReflectionResult;
};

export function ReflectionExploration({ reflection }: ReflectionExplorationProps) {
  return (
    <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm md:p-6">
      <h2 className="text-sm font-medium text-white/62">Next Exploration</h2>
      <p className="mt-2 text-sm text-white/42">Based on your journey</p>

      <ul className="mt-4 space-y-2">
        {reflection.exploration.map((direction) => (
          <li
            key={direction}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/70"
          >
            {direction}
          </li>
        ))}
      </ul>
    </section>
  );
}
