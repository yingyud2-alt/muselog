"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

type ReflectionExitNavProps = {
  className?: string;
};

export function ReflectionExitNav({ className }: ReflectionExitNavProps) {
  return (
    <nav
      aria-label="Reflection exits"
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <Link
        href="/calendar"
        className={cn(
          "inline-flex items-center justify-center rounded-2xl border border-white/[0.1]",
          "bg-white/[0.045] px-5 py-3 font-display text-[13px] font-bold text-white/72",
          "shadow-[0_10px_28px_rgba(0,0,0,0.22)] backdrop-blur-md",
          "transition-colors hover:bg-white/[0.08] hover:text-white/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
        )}
      >
        ← Back to Journal
      </Link>
      <Link
        href="/profile#full-reflection"
        className={cn(
          "inline-flex items-center justify-center rounded-2xl border border-white/[0.1]",
          "bg-white/[0.045] px-5 py-3 font-display text-[13px] font-bold text-white/72",
          "shadow-[0_10px_28px_rgba(0,0,0,0.22)] backdrop-blur-md",
          "transition-colors hover:bg-white/[0.08] hover:text-white/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
        )}
      >
        Open Full Reflection →
      </Link>
    </nav>
  );
}
