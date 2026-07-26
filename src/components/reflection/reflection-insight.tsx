import type { ReflectionResult } from "@/lib/reflection/reflection-types";

type ReflectionInsightProps = {
  reflection: ReflectionResult;
};

export function ReflectionInsight({ reflection }: ReflectionInsightProps) {
  return (
    <section className="rounded-[24px] border border-teal-400/12 bg-gradient-to-br from-teal-950/25 via-white/[0.03] to-slate-950/30 p-5 backdrop-blur-sm md:p-6">
      <h2 className="text-sm font-medium text-teal-200/75">AI Insight</h2>
      <p className="mt-4 text-base leading-relaxed text-white/82 md:text-lg">
        {reflection.summary}
      </p>

      {reflection.insights.length > 0 && (
        <ul className="mt-5 space-y-3">
          {reflection.insights.map((insight) => (
            <li
              key={insight}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-white/68"
            >
              {insight}
            </li>
          ))}
        </ul>
      )}

      {reflection.patterns.length > 0 && (
        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.14em] text-white/35">Patterns</p>
          <ul className="mt-2 space-y-1.5">
            {reflection.patterns.map((pattern) => (
              <li key={pattern} className="text-sm text-white/50">
                {pattern}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
