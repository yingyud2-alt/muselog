"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";

import { BrandLockup } from "@/components/i18n/brand-lockup";
import { useLanguage } from "@/components/i18n/language-provider";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { NavLabel } from "@/components/i18n/nav-label";
import {
  DESKTOP_NAV_ITEMS,
  isDesktopNavActive,
} from "@/components/navigation/nav-items";
import { cn } from "@/lib/utils";

export function DesktopTopNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { t } = useLanguage();

  return (
    <header
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-40 hidden justify-center px-4",
        "pt-[max(12px,env(safe-area-inset-top))] md:flex",
      )}
    >
      <nav
        aria-label={t("nav.desktopAria")}
        className={cn(
          "pointer-events-auto flex w-full max-w-3xl items-center justify-between gap-2",
          "rounded-full border backdrop-blur-md transition-colors",
          "px-2.5 py-1.5 sm:px-3",
          isHome
            ? "border-white/[0.04] bg-[rgba(9,10,15,0.2)] shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
            : "border-white/[0.08] bg-[rgba(13,17,23,0.68)] shadow-[0_6px_28px_rgba(0,0,0,0.22)]",
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2",
            "transition-opacity hover:opacity-90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/20",
          )}
        >
          <span className="flex size-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/75">
            <BookOpen className="size-3.5" aria-hidden="true" />
          </span>
          <BrandLockup
            size="nav"
            className="hidden sm:flex"
          />
        </Link>

        <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const active = isDesktopNavActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "font-display shrink-0 rounded-full px-2.5 py-1 transition-all sm:px-3",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/20",
                  active
                    ? "border border-teal-300/16 bg-teal-400/[0.07] text-white/88 shadow-[0_0_16px_rgba(72,140,130,0.1)]"
                    : "border border-transparent text-white/45 hover:bg-white/[0.04] hover:text-white/72",
                )}
              >
                <NavLabel
                  titleKey={item.titleKey}
                  subtitleKey={item.subtitleKey}
                  variant="desktop"
                />
              </Link>
            );
          })}
        </div>

        <LanguageSwitcher className="shrink-0" />
      </nav>
    </header>
  );
}
