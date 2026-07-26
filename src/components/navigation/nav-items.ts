import type { LucideIcon } from "lucide-react";
import { Calendar, Compass, Home, Library, User } from "lucide-react";

export type DesktopNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

/** Primary desktop navigation — Journal maps to the calendar/journal route. */
export const DESKTOP_NAV_ITEMS: DesktopNavItem[] = [
  { title: "Home", href: "/", icon: Home },
  { title: "Explore", href: "/explore", icon: Compass },
  { title: "Library", href: "/library", icon: Library },
  { title: "Journal", href: "/calendar", icon: Calendar },
  { title: "Profile", href: "/profile", icon: User },
];

export function isDesktopNavActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
