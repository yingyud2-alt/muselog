import type { ProfileIdentity } from "@/types/profile";

type ProfileHeaderProps = {
  identity: ProfileIdentity;
};

export function ProfileHeader({ identity }: ProfileHeaderProps) {
  return (
    <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm md:p-8">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35 md:text-[11px]">
        Muse Profile
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white/92 md:text-4xl">
        {identity.displayName}
      </h1>
      <p className="mt-3 text-sm text-white/52 md:text-base">
        {identity.totalMemories} memories collected
      </p>
      <p className="mt-1 text-sm text-white/38">{identity.memberSince}</p>
    </section>
  );
}
