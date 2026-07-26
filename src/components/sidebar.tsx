"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import {
  DESKTOP_NAV_ITEMS,
  isDesktopNavActive,
  type DesktopNavItem,
} from "@/components/navigation/nav-items";

type NavItem = DesktopNavItem;

const navItems = DESKTOP_NAV_ITEMS;

const DRAWER_TRANSITION = {
  duration: 0.22,
  ease: [0, 0, 0.2, 1] as const,
};

function isActive(pathname: string, href: string) {
  return isDesktopNavActive(pathname, href);
}

export function Sidebar() {
  const pathname = usePathname();
  const drawerId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  const openDrawer = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDrawer, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.requestAnimationFrame(() => {
        closeRef.current?.focus();
      });
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      return;
    }

    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOpen = () => {
      openDrawer();
    };

    window.addEventListener("muselog-nav-open", handleOpen);

    return () => {
      window.removeEventListener("muselog-nav-open", handleOpen);
    };
  }, [openDrawer]);

  const hideHomeDesktopTrigger = pathname === "/";

  return (
    <>
      {!isOpen && (
        <button
          ref={triggerRef}
          type="button"
          aria-label="Open navigation"
          aria-expanded={isOpen}
          aria-controls={drawerId}
          onClick={openDrawer}
          className={cn(
            "fixed z-50 flex size-11 items-center justify-center",
            "rounded-full border border-white/10 bg-[#0D1117]/82 text-white/72",
            "shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-md",
            "transition-colors hover:border-white/16 hover:bg-[#131922]/90 hover:text-white/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
            "right-4 top-[calc(env(safe-area-inset-top)+16px)] md:left-6 md:right-auto md:top-6",
            "max-md:hidden",
            hideHomeDesktopTrigger && "md:hidden",
          )}
        >
          <Menu className="size-[18px]" aria-hidden="true" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              role="presentation"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={DRAWER_TRANSITION}
              onClick={closeDrawer}
              className="fixed inset-0 z-[55] bg-black/42 backdrop-blur-[2px]"
            />

            <motion.aside
              id={drawerId}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={DRAWER_TRANSITION}
              className={cn(
                "fixed inset-y-0 left-0 z-[60] flex w-[min(86vw,320px)] flex-col",
                "border-r border-white/10 bg-[#10161D] text-white shadow-[8px_0_40px_rgba(0,0,0,0.35)]",
                "sm:w-[260px] md:w-[280px] lg:w-[300px]",
              )}
            >
              <div className="flex items-center justify-between px-5 pb-2 pt-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/8 text-white/88">
                    <BookOpen className="size-4" aria-hidden="true" />
                  </div>
                  <span className="text-lg font-semibold tracking-tight text-white/92">
                    MuseLog
                  </span>
                </div>

                <button
                  ref={closeRef}
                  type="button"
                  aria-label="Close navigation"
                  onClick={closeDrawer}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl text-white/58",
                    "transition-colors hover:bg-white/6 hover:text-white/88",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                  )}
                >
                  <X className="size-[18px]" aria-hidden="true" />
                </button>
              </div>

              <nav
                aria-label="Primary navigation"
                className="flex flex-1 flex-col gap-1.5 px-3 pb-6 pt-3"
              >
                {navItems.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={closeDrawer}
                      className={cn(
                        "flex h-12 items-center gap-3 rounded-2xl px-3.5 text-[15px] font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/52 hover:bg-white/5 hover:text-white/78",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-[18px] shrink-0",
                          active ? "text-white/92" : "text-white/44",
                        )}
                        aria-hidden="true"
                      />
                      {item.title}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export { navItems, type NavItem };
