"use client";

import Link from "next/link";

import type {
  LibraryStatusFilter,
  LibraryTypeFilter,
} from "@/lib/library/library-types";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS: Array<{ id: LibraryTypeFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "BOOK", label: "Books" },
  { id: "MOVIE", label: "Movies" },
  { id: "MUSIC", label: "Music" },
];

const STATUS_OPTIONS: Array<{ id: LibraryStatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "WANT", label: "Want" },
  { id: "ONGOING", label: "In Progress" },
  { id: "FINISHED", label: "Finished" },
];

type LibraryEmptyStateProps = {
  query: string;
  typeFilter: LibraryTypeFilter;
  statusFilter: LibraryStatusFilter;
};

export function LibraryEmptyState({
  query,
  typeFilter,
  statusFilter,
}: LibraryEmptyStateProps) {
  let message = "No titles found in your Library.";

  if (query) {
    message = "No titles found in your Library.";
  } else if (statusFilter === "FINISHED" && typeFilter === "MOVIE") {
    message = "No finished movies yet.";
  } else if (statusFilter === "WANT") {
    message = "Your watchlist is empty.";
  } else if (statusFilter === "ONGOING") {
    message = "Nothing in progress right now.";
  } else if (statusFilter === "FINISHED") {
    message = "No finished titles yet.";
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm text-white/55">{message}</p>
      <Link
        href="/explore"
        className="mt-4 rounded-full border border-white/14 px-4 py-2 text-sm text-white/72 transition-colors hover:bg-white/[0.04]"
      >
        Explore titles
      </Link>
    </div>
  );
}

type FilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
        active
          ? "border-white/24 bg-white/10 text-white/88"
          : "border-white/10 text-white/52 hover:bg-white/[0.04]",
      )}
    >
      {label}
    </button>
  );
}

type LibraryFiltersProps = {
  typeFilter: LibraryTypeFilter;
  statusFilter: LibraryStatusFilter;
  onTypeChange: (value: LibraryTypeFilter) => void;
  onStatusChange: (value: LibraryStatusFilter) => void;
  className?: string;
};

export function LibraryFilters({
  typeFilter,
  statusFilter,
  onTypeChange,
  onStatusChange,
  className,
}: LibraryFiltersProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-wrap md:overflow-visible">
        {TYPE_OPTIONS.map((option) => (
          <FilterChip
            key={option.id}
            label={option.label}
            active={typeFilter === option.id}
            onClick={() => onTypeChange(option.id)}
          />
        ))}
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-wrap md:overflow-visible">
        {STATUS_OPTIONS.map((option) => (
          <FilterChip
            key={option.id}
            label={option.label}
            active={statusFilter === option.id}
            onClick={() => onStatusChange(option.id)}
          />
        ))}
      </div>
    </div>
  );
}
