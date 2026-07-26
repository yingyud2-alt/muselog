import type { ProfileStats } from "@/types/profile";

type ProfileStatsProps = {
  stats: ProfileStats;
};

function StatBlock({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-5 text-center">
      <p className="text-2xl font-semibold tracking-tight text-white/88 md:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/38">
        {label}
      </p>
    </div>
  );
}

export function ProfileStatsSection({ stats }: ProfileStatsProps) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium text-white/62">Media Overview</h2>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatBlock value={stats.books} label="Books" />
        <StatBlock value={stats.movies} label="Films" />
        <StatBlock value={stats.music} label="Albums" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:mt-4 md:gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
          <p className="text-xl font-semibold text-white/85">{stats.finished}</p>
          <p className="mt-1 text-xs text-white/40">Finished</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
          <p className="text-xl font-semibold text-white/85">{stats.ongoing}</p>
          <p className="mt-1 text-xs text-white/40">Currently Exploring</p>
        </div>
      </div>
    </section>
  );
}
