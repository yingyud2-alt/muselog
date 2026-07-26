import { CalendarView } from "@/components/calendar/CalendarView";
import { MobileCalendar } from "@/components/mobile/MobileCalendar";

export default function CalendarPage() {
  return (
    <main className="min-h-[100svh] overflow-x-hidden bg-[#0D1117] text-white md:min-h-screen">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 hidden md:block"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(45,212,191,0.06) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(56,189,248,0.04) 0%, transparent 50%)",
        }}
      />

      <div className="md:hidden">
        <MobileCalendar />
      </div>

      <div className="hidden pb-[calc(env(safe-area-inset-bottom)+32px)] md:block">
        <CalendarView />
      </div>
    </main>
  );
}
