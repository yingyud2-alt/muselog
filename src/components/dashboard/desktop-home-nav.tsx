"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import {
  DESKTOP_NAV_ITEMS,
  isDesktopNavActive,
} from "@/components/navigation/nav-items";
import { cn } from "@/lib/utils";

/** @deprecated Home now uses global DesktopTopNav. Kept for compatibility. */
export function openDesktopNavigation() {
  window.dispatchEvent(new CustomEvent("muselog-nav-open"));
}

/** @deprecated Replaced by DesktopTopNav in root layout. */
export function DesktopHomeNav() {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full border border-white/10",
        "bg-[#0D1117]/72 px-1.5 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl",
      )}
    >
      {DESKTOP_NAV_ITEMS.map((item) => {
        const active = isDesktopNavActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "font-display rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
              active
                ? "bg-white/12 text-white/92"
                : "text-white/50 hover:bg-white/[0.06] hover:text-white/78",
            )}
          >
            {item.title}
          </Link>
        );
      })}

      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={openDesktopNavigation}
        className={cn(
          "ml-0.5 flex size-8 items-center justify-center rounded-full",
          "text-white/58 transition-colors hover:bg-white/[0.08] hover:text-white/88",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
        )}
      >
        <Menu className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
