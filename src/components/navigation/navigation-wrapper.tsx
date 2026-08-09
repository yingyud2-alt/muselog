"use client";

import { usePathname } from "next/navigation";

import { DetailOverlayHost } from "@/components/detail/detail-overlay-host";
import { DesktopTopNav } from "@/components/navigation/desktop-top-nav";
import { ReturnContextRestorer } from "@/components/navigation/return-context-restorer";
import { CanonicalWorkBootstrap } from "@/components/work/canonical-work-bootstrap";
import { cn } from "@/lib/utils";

type NavigationWrapperProps = {
  children: React.ReactNode;
};

export function NavigationWrapper({ children }: NavigationWrapperProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      <CanonicalWorkBootstrap />
      <DesktopTopNav />
      <div className={cn(!isHome && "md:pt-[72px]")}>{children}</div>
      <DetailOverlayHost />
      <ReturnContextRestorer />
    </>
  );
}
