import type { ReflectionMediaStats } from "@/lib/reflection/reflection-types";

type ReflectionOverviewProps = {
  stats: ReflectionMediaStats;
};

function OverviewStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
      <p className="text-2xl font-semibold text-white/88">{value}</p>
      <p className="mt-1 text-xs text-white/40">{label}</p>
    </div>
  );
}

export function ReflectionOverview({ stats }: ReflectionOverviewProps) {
  return (
    <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm md:p-6">
      <h2 className="text-sm font-medium text-white/62">Overview</h2>
      <p className="mt-2 text-sm text-white/48">This month you explored:</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <OverviewStat value={stats.books} label="Books" />
        <OverviewStat value={stats.movies} label="Films" />
        <OverviewStat value={stats.music} label="Music" />
        <OverviewStat value={stats.journalDays} label="Journal days" />
      </div>
    </section>
  );
}
