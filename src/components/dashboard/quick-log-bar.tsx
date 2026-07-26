"use client";

import { Search, Plus } from "lucide-react";

import { MediaSearchBar } from "@/components/explore/media-search-bar";
import { cn } from "@/lib/utils";

function MobileQuickLogBar() {
  return (
    <div
      className={cn(
        "flex items-center justify-between text-white",
        "min-h-[54px] rounded-2xl border border-white/10 bg-[#0D1117]/88 px-4 py-2.5",
        "shadow-[0_8px_32px_rgba(0,0,0,0.32)] backdrop-blur-xl",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5 pr-3 text-white/40">
        <Search className="size-4 shrink-0" />
        <span className="truncate text-sm">Search your memories...</span>
      </div>

      <button
        type="button"
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm transition hover:bg-white/20"
      >
        <Plus className="size-4" />
        Log
      </button>
    </div>
  );
}

export default function QuickLogBar({
  mode = "all",
}: {
  mode?: "all" | "mobile" | "desktop";
}) {
  const showMobile = mode === "all" || mode === "mobile";
  const showDesktop = mode === "all" || mode === "desktop";

  return (
    <>
      {showMobile && (
        <div
          className={cn(
            "fixed left-1/2 z-[45] w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2",
            "bottom-[calc(env(safe-area-inset-bottom)+14px)] md:hidden",
          )}
        >
          <MobileQuickLogBar />
        </div>
      )}

      {showDesktop && (
        <div className="mx-auto mt-0 hidden max-w-3xl md:block">
          <MediaSearchBar
            variant="home"
            inputId="home-media-search"
            placeholder="Search your memories, journals, and discoveries..."
          />
        </div>
      )}
    </>
  );
}
