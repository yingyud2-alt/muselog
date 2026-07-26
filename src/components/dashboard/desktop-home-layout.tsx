import MoodBubbles from "@/components/dashboard/mood-bubbles";
import QuickLogBar from "@/components/dashboard/quick-log-bar";

type DesktopHomeLayoutProps = {
  children: React.ReactNode;
};

export function DesktopHomeLayout({ children }: DesktopHomeLayoutProps) {
  return (
    <div className="relative hidden md:block">
      <section className="relative w-full shrink-0" aria-label="Mood bubbles">
        <MoodBubbles />
      </section>

      <div className="mx-auto max-w-3xl px-6 pb-2 pt-6 md:px-8">
        <QuickLogBar mode="desktop" />
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-6 pb-10 pt-8 md:px-8">
        {children}
      </div>
    </div>
  );
}
