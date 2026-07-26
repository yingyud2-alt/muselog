import { cn } from "@/lib/utils";

type DashboardGlassCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function DashboardGlassCard({
  children,
  className,
}: DashboardGlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-white/[0.03]",
        "shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

type DashboardSectionHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function DashboardSectionHeader({
  title,
  description,
  action,
}: DashboardSectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-bold tracking-tight text-white/88">
          {title}
        </h2>
        {description ? (
          <p className="font-display text-sm text-white/42">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
