"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  isMobileNavActive,
  MOBILE_NAV_ITEMS,
} from "@/lib/mobile/nav-items";
import { cn } from "@/lib/utils";

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] md:hidden"
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto flex max-w-md items-center justify-around",
          "rounded-[28px] border border-white/10 bg-[#0D1117]/78 px-2 py-2",
          "shadow-[0_8px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.04)]",
          "backdrop-blur-2xl",
        )}
      >
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isMobileNavActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/35",
                active
                  ? "text-white"
                  : "text-white/42 hover:text-white/68",
              )}
            >
              <Icon
                className={cn(
                  "size-[18px] shrink-0",
                  active ? "text-teal-300/90" : "text-white/40",
                )}
                aria-hidden="true"
              />
              <span className="truncate text-[10px] font-medium tracking-wide">
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
