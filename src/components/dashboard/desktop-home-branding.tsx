"use client";

import { BookOpen } from "lucide-react";

import { BrandLockup } from "@/components/i18n/brand-lockup";

export function DesktopHomeBranding() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/88">
        <BookOpen className="size-4" aria-hidden="true" />
      </div>
      <BrandLockup showSupportingLine />
    </div>
  );
}
