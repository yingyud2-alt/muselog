import Link from "next/link";

import type { MonthlyReflection } from "@/types/profile";

type ProfileReflectionProps = {
  reflection: MonthlyReflection;
  previewSummary: string;
};

function ReflectionStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-lg font-medium text-white/82">{value}</p>
      <p className="mt-0.5 text-xs text-white/40">{label}</p>
    </div>
  );
}

export function ProfileReflection({
  reflection,
  previewSummary,
}: ProfileReflectionProps) {
  return (
    <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm md:p-6">
      <h2 className="text-sm font-medium text-white/62">
        {reflection.month} Reflection
      </h2>

      <div className="mt-4 rounded-2xl border border-teal-400/10 bg-teal-500/[0.04] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-teal-300/55">
          AI Reflection preview
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/68">
          {previewSummary}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
        <ReflectionStat label="Books experienced" value={reflection.books} />
        <ReflectionStat label="Movies watched" value={reflection.movies} />
        <ReflectionStat label="Music listened" value={reflection.music} />
        <ReflectionStat label="Journal days" value={reflection.journalDays} />
        <ReflectionStat
          label="Streak"
          value={`${reflection.streak} days`}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/reflection"
          className="rounded-xl bg-teal-500/15 px-4 py-2 text-sm font-medium text-teal-200/90 hover:bg-teal-500/20"
        >
          Reflect on this month
        </Link>
        <Link
          href="/reflection"
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/65 hover:bg-white/[0.04]"
        >
          View full reflection
        </Link>
      </div>
    </section>
  );
}
