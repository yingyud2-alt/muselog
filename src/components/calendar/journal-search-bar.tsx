"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type JournalSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function JournalSearchBar({
  value,
  onChange,
  className,
}: JournalSearchBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5",
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-white/35" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search books, movies, music..."
        className="min-w-0 flex-1 bg-transparent text-sm text-white/82 placeholder:text-white/35 outline-none"
      />
    </div>
  );
}
