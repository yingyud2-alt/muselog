import { ExploreCatalog } from "@/components/explore/explore-catalog";

export default function ExplorePage() {
  return (
    <main className="min-h-[100svh] overflow-x-hidden bg-[#0D1117] pb-[calc(env(safe-area-inset-bottom)+32px)] text-white md:min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-8 md:py-10">
        <header className="mb-10 max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/38">
            Explore
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white/95 md:text-4xl">
            Discover something that matches your feeling.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/48 md:text-base">
            Browse books, films, and music — then save what resonates to your
            personal MuseLog.
          </p>
        </header>

        <ExploreCatalog />
      </div>
    </main>
  );
}
