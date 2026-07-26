import type { LucideIcon } from "lucide-react";
import { Calendar, Compass, Home, Library } from "lucide-react";

export type MobileNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { title: "Home", href: "/", icon: Home },
  { title: "Explore", href: "/explore", icon: Compass },
  { title: "Journal", href: "/calendar", icon: Calendar },
  { title: "Library", href: "/library", icon: Library },
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
