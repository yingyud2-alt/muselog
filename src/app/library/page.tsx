import { DesktopLibrary } from "@/components/library/desktop-library";
import { LibraryView } from "@/components/library/library-view";

export default function LibraryPage() {
  return (
    <main className="min-h-[100svh] overflow-x-hidden bg-[#0D1117] text-white md:min-h-screen md:bg-[#090A0F]">
      <div className="md:hidden">
        <LibraryView />
      </div>
      <div className="hidden md:block">
        <DesktopLibrary />
      </div>
    </main>
  );
}
