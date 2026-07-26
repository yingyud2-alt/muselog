import MoodBubbles from "@/components/dashboard/mood-bubbles";
import QuickLogBar from "@/components/dashboard/quick-log-bar";

type DesktopHomeLayoutProps = {
  children: React.ReactNode;
};

export function DesktopHomeLayout({ children }: DesktopHomeLayoutProps) {
  return (
    <div className="relative hidden md:block">
      <div className="flex min-h-[100svh] flex-col">
        <section
          className="relative min-h-[calc(100svh-88px)] flex-1"
          aria-label="Mood bubbles"
        >
          <MoodBubbles />
        </section>

        <div className="shrink-0 px-6 pb-5 pt-1 md:px-8">
          <QuickLogBar mode="desktop" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-6 pb-10 pt-6 md:px-8">
        {children}
      </div>
    </div>
  );
}
