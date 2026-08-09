import type { LucideIcon } from "lucide-react";
import { Calendar, Compass, Home, Library, User } from "lucide-react";

import type { NavSubtitleKey, NavTitleKey } from "@/lib/i18n";

export type DesktopNavItem = {
  titleKey: NavTitleKey;
  subtitleKey: NavSubtitleKey;
  href: string;
  icon: LucideIcon;
};

/** Primary desktop navigation — Journal maps to the calendar/journal route. */
export const DESKTOP_NAV_ITEMS: DesktopNavItem[] = [
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
    titleKey: "nav.library",
    subtitleKey: "nav.libraryEn",
    href: "/library",
    icon: Library,
  },
  {
    titleKey: "nav.journal",
    subtitleKey: "nav.journalEn",
    href: "/calendar",
    icon: Calendar,
  },
  {
    titleKey: "nav.profile",
    subtitleKey: "nav.profileEn",
    href: "/profile",
    icon: User,
  },
];

export function isDesktopNavActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
