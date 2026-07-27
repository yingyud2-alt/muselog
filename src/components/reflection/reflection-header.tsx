type ReflectionHeaderProps = {
  monthYear: string;
};

export function ReflectionHeader({ monthYear }: ReflectionHeaderProps) {
  return (
    <header className="muse-dark-panel rounded-[28px] bg-gradient-to-br from-teal-950/20 via-white/[0.03] to-slate-950/40 p-6 backdrop-blur-sm md:p-8">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35 md:text-[11px]">
        {monthYear.split(" ")[0]} Reflection
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white/92 md:text-3xl">
        Your cultural journey this month
      </h1>
      <p className="mt-2 text-sm text-white/45">{monthYear}</p>
    </header>
  );
}
