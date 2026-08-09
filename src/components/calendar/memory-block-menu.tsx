"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { MemoryDeleteConfirm } from "@/components/calendar/memory-delete-confirm";
import { normalizeCalendarDate } from "@/lib/calendar/calendar-date";
import { deleteJournalMemory } from "@/lib/calendar/delete-journal-memory";
import { getJourneyStart } from "@/lib/calendar/journey-utils";
import { openJournalEntryWorkDetail } from "@/lib/calendar/open-journal-work-detail";
import { resolveJournalWorkId } from "@/lib/calendar/resolve-journal-work-cover";
import { mediaTypeToContentType } from "@/lib/content/bubble-content-bridge";
import { openJournalQuickLog } from "@/lib/detail/detail-overlay-store";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

type MemoryBlockMenuProps = {
  item: MediaItem;
  className?: string;
};

/**
 * Hover "…" menu on calendar memory blocks.
 * Edit / View Work / Delete Memory — does not delete Work.
 */
export function MemoryBlockMenu({ item, className }: MemoryBlockMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleEdit = () => {
    setOpen(false);
    const workId = resolveJournalWorkId(item);
    openJournalQuickLog(workId, {
      entryId: item.id,
      initialDate:
        normalizeCalendarDate(getJourneyStart(item)) ??
        normalizeCalendarDate(item.date) ??
        undefined,
      snapshot: {
        title: item.title,
        creator: item.creator,
        type: mediaTypeToContentType(item.type),
        cover: item.cover,
        tags: item.tags,
      },
    });
  };

  const handleViewWork = () => {
    setOpen(false);
    openJournalEntryWorkDetail(item);
  };

  const handleAskDelete = () => {
    setOpen(false);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setBusy(true);
    const ok = await deleteJournalMemory(item.id);
    setBusy(false);
    if (ok) {
      setConfirmOpen(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "absolute right-0 top-0 z-50",
        "opacity-0 transition-opacity duration-150",
        "group-hover/card:opacity-100 focus-within:opacity-100",
        open && "opacity-100",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Memory actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        onPointerDown={(event) => event.stopPropagation()}
        className={cn(
          "flex size-6 items-center justify-center rounded-full",
          "border border-white/12 bg-[#121820]/92 text-white/70 shadow-[0_4px_12px_rgba(0,0,0,0.35)]",
          "backdrop-blur-md transition-colors hover:bg-[#1a222c] hover:text-white",
          open && "bg-[#1a222c] text-white",
        )}
      >
        <MoreHorizontal className="size-3.5" aria-hidden="true" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Memory actions"
          className={cn(
            "absolute right-0 top-7 w-[148px] overflow-hidden rounded-xl",
            "border border-white/[0.1] bg-[#121820]/96 py-1 shadow-[0_16px_40px_rgba(0,0,0,0.55)]",
            "backdrop-blur-md",
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <MenuItem label="Edit Memory" onSelect={handleEdit} />
          <MenuItem label="View Work Detail" onSelect={handleViewWork} />
          <div className="my-1 h-px bg-white/[0.08]" aria-hidden="true" />
          <MenuItem
            label="Delete Memory"
            tone="danger"
            onSelect={handleAskDelete}
          />
        </div>
      ) : null}

      <MemoryDeleteConfirm
        open={confirmOpen}
        title={item.title}
        busy={busy}
        onCancel={() => {
          if (!busy) setConfirmOpen(false);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function MenuItem({
  label,
  onSelect,
  tone = "default",
}: {
  label: string;
  onSelect: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelect();
      }}
      className={cn(
        "flex w-full px-3 py-2 text-left text-[11px] transition-colors",
        tone === "danger"
          ? "text-rose-200/85 hover:bg-rose-400/10"
          : "text-white/75 hover:bg-white/[0.06] hover:text-white",
      )}
    >
      {label}
    </button>
  );
}
