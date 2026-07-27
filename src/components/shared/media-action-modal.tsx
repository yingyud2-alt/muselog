"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

import { DARK_FLOATING_PANEL_CLASS } from "@/lib/ui/dark-panel";
import { cn } from "@/lib/utils";

/** Translucent overlay — homepage / bubbles stay visible underneath */
export const MEDIA_ACTION_OVERLAY_CLASS =
  "fixed inset-0 z-50 bg-[#090A0F]/40 backdrop-blur-[10px] saturate-[1.1]";

export const MEDIA_ACTION_PANEL_CLASS = cn(
  DARK_FLOATING_PANEL_CLASS,
  "bg-white/[0.055]",
  "shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl",
);

type MediaActionModalProps = {
  ariaLabel: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Cover / media column on the left */
  cover?: React.ReactNode;
  className?: string;
  /** Panel width target within the 500–650px band */
  width?: number;
};

/**
 * Shared desktop glass modal for media actions
 * (Add to Journal, Read & Rate, memory detail).
 * Mobile sheets should stay separate.
 */
export function MediaActionModal({
  ariaLabel,
  onClose,
  children,
  cover,
  className,
  width = 600,
}: MediaActionModalProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 hidden items-center justify-center p-8 md:flex">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.99 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className={cn(
          "pointer-events-auto relative flex max-h-[min(82svh,640px)] overflow-hidden rounded-3xl text-white",
          MEDIA_ACTION_PANEL_CLASS,
          className,
        )}
        style={{ width: `min(92vw, ${width}px)` }}
      >
        <button
          type="button"
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white/70 transition-opacity hover:opacity-100"
          onClick={onClose}
        >
          <X size={15} />
        </button>

        {cover ? (
          <aside className="flex w-[168px] shrink-0 flex-col border-r border-white/[0.06] p-6 pr-4">
            {cover}
          </aside>
        ) : null}

        <div
          className={cn(
            "min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain",
            cover ? "p-6 pl-5 pr-12" : "p-7 pr-12",
          )}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}

type MediaActionCoverProps = {
  background: string;
  children: React.ReactNode;
  className?: string;
};

export function MediaActionCover({
  background,
  children,
  className,
}: MediaActionCoverProps) {
  return (
    <div
      className={cn(
        "flex aspect-[3/4] w-full max-h-[220px] items-center justify-center rounded-2xl",
        className,
      )}
      style={{ background }}
    >
      {children}
    </div>
  );
}
