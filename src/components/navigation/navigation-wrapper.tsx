"use client";

import { usePathname } from "next/navigation";

import { DesktopTopNav } from "@/components/navigation/desktop-top-nav";
import { cn } from "@/lib/utils";

type NavigationWrapperProps = {
  children: React.ReactNode;
};

export function NavigationWrapper({ children }: NavigationWrapperProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      <DesktopTopNav />
      <div className={cn(!isHome && "md:pt-[72px]")}>{children}</div>
    </>
  );
}
