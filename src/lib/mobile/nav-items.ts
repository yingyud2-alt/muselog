import type { LucideIcon } from "lucide-react";
import { Calendar, Compass, Home, Library, User } from "lucide-react";

import type { NavSubtitleKey, NavTitleKey } from "@/lib/i18n";

export type MobileNavItem = {
  titleKey: NavTitleKey;
  subtitleKey: NavSubtitleKey;
  href: string;
  icon: LucideIcon;
};

export const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  {
    titleKey: "nav.home",
    subtitleKey: "nav.homeEn",
    href: "/",
    icon: Home,
  },
  {
    titleKey: "nav.explore",
    subtitleKey: "nav.exploreEn",
    href: "/explore",
    icon: Compass,
  },
  {
    titleKey: "nav.journal",
    subtitleKey: "nav.journalEn",
    href: "/calendar",
    icon: Calendar,
  },
  {
    titleKey: "nav.library",
    subtitleKey: "nav.libraryEn",
    href: "/library",
    icon: Library,
  },
  {
    titleKey: "nav.profile",
    subtitleKey: "nav.profileEn",
    href: "/profile",
    icon: User,
  },
];

/** Bottom nav bar + floating margin (px). Used for page padding. */
export const MOBILE_NAV_CLEARANCE =
  "calc(env(safe-area-inset-bottom) + 88px)";

export function isMobileNavActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
