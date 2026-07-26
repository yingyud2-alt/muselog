"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";
import { cn } from "@/lib/utils";

type LibraryPanelShellProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Wider editorial panel for desktop archive details. */
  wide?: boolean;
  /**
   * When false, body scroll lock is owned by the detail overlay store
   * (needed for stacked modals that preserve underlying scroll).
   */
  lockScroll?: boolean;
  /** Stacking order for nested detail layers. */
  zIndex?: number;
};

/**
 * Shared Library detail shell — soft archival panel, not a glossy app card.
 */
export function LibraryPanelShell({
  open,
  title,
  onClose,
  children,
  wide = true,
  lockScroll = true,
  zIndex = 60,
}: LibraryPanelShellProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    if (lockScroll) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (lockScroll) {
        document.body.style.overflow = "";
      }
    };
  }, [open, onClose, lockScroll]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md"
            style={{ zIndex }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className={cn(
              "fixed overflow-y-auto text-white",
              "border border-white/[0.08] bg-[rgba(15,20,28,0.85)] backdrop-blur-xl",
              "inset-x-0 bottom-0 max-h-[90svh] rounded-t-[24px] p-5 md:hidden",
            )}
            style={{ paddingBottom: MOBILE_NAV_CLEARANCE, zIndex: zIndex + 1 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white"
            >
              <X size={18} />
            </button>
            {children}
          </motion.div>

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={cn(
              "fixed left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2",
              "max-h-[min(86vh,720px)] overflow-y-auto rounded-[22px]",
              "border border-white/[0.08] bg-[rgba(15,20,28,0.85)] p-7 backdrop-blur-xl md:block",
              wide ? "w-[min(92vw,860px)]" : "w-[min(92vw,520px)]",
            )}
            style={{ zIndex: zIndex + 1 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-5 top-5 z-10 flex size-9 items-center justify-center rounded-full text-white/55 transition-colors hover:text-white"
            >
              <X size={18} />
            </button>
            {children}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
