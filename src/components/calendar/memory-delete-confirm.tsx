"use client";

import { AnimatePresence, motion } from "framer-motion";

import { DARK_FLOATING_PANEL_CLASS } from "@/lib/ui/dark-panel";
import { cn } from "@/lib/utils";

type MemoryDeleteConfirmProps = {
  open: boolean;
  title?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Confirm journal memory deletion — Work / Library stay intact.
 */
export function MemoryDeleteConfirm({
  open,
  title,
  busy = false,
  onCancel,
  onConfirm,
}: MemoryDeleteConfirmProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Dismiss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={busy ? undefined : onCancel}
            className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-memory-title"
            aria-describedby="delete-memory-desc"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className={cn(
              "fixed left-1/2 top-1/2 z-[91] w-[min(92vw,360px)] -translate-x-1/2 -translate-y-1/2",
              "rounded-[20px] p-5 text-white",
              DARK_FLOATING_PANEL_CLASS,
              "bg-[rgba(15,20,28,0.94)] backdrop-blur-xl",
            )}
          >
            <h2
              id="delete-memory-title"
              className="font-display text-lg font-semibold tracking-tight text-white/95"
            >
              Remove this memory?
            </h2>
            <p
              id="delete-memory-desc"
              className="mt-2 text-sm leading-relaxed text-white/55"
            >
              The work will remain in your library.
              {title ? (
                <span className="mt-1 block text-white/40">“{title}”</span>
              ) : null}
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onConfirm}
                className={cn(
                  "rounded-full bg-rose-400/15 py-2.5 text-sm font-medium text-rose-100",
                  "ring-1 ring-rose-300/25 transition-colors hover:bg-rose-400/22",
                  "disabled:opacity-50",
                )}
              >
                {busy ? "Removing…" : "Delete Memory"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onCancel}
                className="rounded-full border border-white/12 py-2.5 text-sm text-white/60 transition-colors hover:text-white/85 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
