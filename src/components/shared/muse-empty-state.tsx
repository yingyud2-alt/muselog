import Link from "next/link";

import { cn } from "@/lib/utils";

type MuseEmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

export function MuseEmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: MuseEmptyStateProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/[0.08]",
        "bg-white/[0.03] px-6 py-12 text-center",
        "shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 50% 60% at 20% 0%, rgba(122,217,189,0.07), transparent 55%)",
            "radial-gradient(ellipse 45% 50% at 90% 100%, rgba(109,143,163,0.08), transparent 50%)",
          ].join(", "),
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-sm">
        <p className="text-[15px] font-medium text-white/78">{title}</p>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-white/42">
            {description}
          </p>
        ) : null}

        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className={cn(
              "mt-6 inline-flex items-center justify-center rounded-full",
              "border border-teal-300/20 bg-teal-400/[0.08] px-4 py-2.5",
              "text-sm text-teal-50/85 transition-colors hover:bg-teal-400/[0.14]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200/20",
            )}
          >
            {actionLabel}
          </button>
        ) : null}

        {actionLabel && actionHref && !onAction ? (
          <Link
            href={actionHref}
            className={cn(
              "mt-6 inline-flex items-center justify-center rounded-full",
              "border border-teal-300/20 bg-teal-400/[0.08] px-4 py-2.5",
              "text-sm text-teal-50/85 transition-colors hover:bg-teal-400/[0.14]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200/20",
            )}
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

