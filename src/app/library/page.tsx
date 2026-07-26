import { MobileLibrary } from "@/components/mobile/MobileLibrary";

export default function LibraryPage() {
  return (
    <main className="min-h-[100svh] overflow-x-hidden bg-[#0D1117] text-white md:min-h-screen">
      <div className="md:hidden">
        <MobileLibrary />
      </div>

      <div className="mx-auto hidden max-w-6xl px-8 py-10 md:block">
        <header className="mb-8 max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/38">
            Library
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white/95">
            Your personal collection
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/48">
            Books, films, and music you&apos;ve saved — open on mobile for the
            full journal experience.
          </p>
        </header>
      </div>
    </main>
  );
}
