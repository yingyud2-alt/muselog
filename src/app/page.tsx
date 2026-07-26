import { DesktopHomeLayout } from "@/components/dashboard/desktop-home-layout";
import { DesktopHomeSections } from "@/components/dashboard/desktop-home-sections";
import QuickLogBar from "@/components/dashboard/quick-log-bar";
import { MobileHome } from "@/components/mobile/MobileHome";

export default function Home() {
  return (
    <main className="min-h-[100svh] overflow-x-hidden bg-[#0D1117] text-white md:min-h-screen">
      <div className="md:hidden">
        <MobileHome />
        <QuickLogBar mode="mobile" />
      </div>

      <DesktopHomeLayout>
        <DesktopHomeSections />
      </DesktopHomeLayout>
    </main>
  );
}
