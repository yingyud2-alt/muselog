"use client";

import { Search, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

function QuickLogBarInner({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between text-white",
        "border border-white/10 bg-[#0D1117]/88 backdrop-blur-xl",
        "shadow-[0_8px_32px_rgba(0,0,0,0.32)]",
        compact
          ? "min-h-[54px] rounded-2xl px-4 py-2.5"
          : "rounded-full px-6 py-4 shadow-[0_0_40px_rgba(255,255,255,0.05)] bg-white/5",
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2.5 text-white/40",
          compact ? "pr-3" : "gap-3",
        )}
      >
        <Search className={cn("shrink-0", compact ? "size-4" : "size-5")} />
        <span className={cn("truncate", compact ? "text-sm" : undefined)}>
          Search your memories...
        </span>
      </div>

      <button
        type="button"
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 transition hover:bg-white/20",
          compact ? "px-3.5 py-2 text-sm" : "gap-2 px-4 py-2 text-sm",
        )}
      >
        <Plus className="size-4" />
        Log
      </button>
    </div>
  );
}

export default function QuickLogBar() {
  return (
    <>
      <div
        className={cn(
          "fixed left-1/2 z-[45] w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2",
          "bottom-[calc(env(safe-area-inset-bottom)+14px)] md:hidden",
        )}
      >
        <QuickLogBarInner compact />
      </div>

      <div className="mx-auto mt-4 hidden max-w-3xl md:block">
        <QuickLogBarInner />
      </div>
    </>
  );
}
