"use client";

import { MuseEmptyState } from "@/components/shared/muse-empty-state";
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
  { id: "ONGOING", label: "Reading" },
  { id: "FINISHED", label: "Finished" },
  { id: "DROPPED", label: "Dropped" },
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
  let title = "No memories yet.";
  let description = "Start your first journey and build a quiet archive.";

  if (query) {
    title = "Nothing matches this search.";
    description = "Try another title, creator, or mood.";
  } else if (statusFilter === "FINISHED" && typeFilter === "MOVIE") {
    title = "No finished movies yet.";
    description = "When a film stays with you, mark it finished here.";
  } else if (statusFilter === "WANT") {
    title = "Your waiting list is empty.";
    description = "Save something you want to read, watch, or listen to.";
  } else if (statusFilter === "ONGOING") {
    title = "Nothing in progress right now.";
    description = "Begin a work and it will appear in your journey.";
  } else if (statusFilter === "FINISHED") {
    title = "No finished titles yet.";
    description = "Finish something slowly — your archive will grow.";
  } else if (statusFilter === "DROPPED") {
    title = "Nothing dropped yet.";
    description = "Works you set aside will gather quietly here.";
  } else if (typeFilter !== "all") {
    title = "No titles in this collection yet.";
    description = "Explore and save works that match your feeling.";
  }

  return (
    <MuseEmptyState
      title={title}
      description={description}
      actionLabel="Start your first journey"
      actionHref="/explore"
    />
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
        "shrink-0 rounded-full border px-3 py-1 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15",
        active
          ? "border-white/16 bg-white/[0.07] text-white/80"
          : "border-transparent text-white/38 hover:bg-white/[0.03] hover:text-white/55",
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
