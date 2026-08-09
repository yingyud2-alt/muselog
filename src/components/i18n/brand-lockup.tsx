"use client";

import { useLanguage } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

type BrandLockupProps = {
  className?: string;
  /** Show Chinese brand line / English slogan under the name stack */
  showSupportingLine?: boolean;
  size?: "nav" | "default";
};

/**
 * Chinese: 忆屿 + MuseLog (+ optional brand line).
 * English: MuseLog (+ optional slogan). Never shows “YIYU”.
 */
export function BrandLockup({
  className,
  showSupportingLine = false,
  size = "default",
}: BrandLockupProps) {
  const { t } = useLanguage();
  const name = t("brand.name");
  const signature = t("brand.signature").trim();
  const slogan = t("brand.slogan").trim();
  const line = t("brand.line").trim();

  const supporting = signature
    ? showSupportingLine
      ? line || slogan
      : null
    : showSupportingLine
      ? slogan
      : null;

  return (
    <span className={cn("flex min-w-0 flex-col", className)}>
      <span
        className={cn(
          "font-display font-bold tracking-tight text-white/90",
          size === "nav" ? "text-[13px]" : "text-sm",
        )}
      >
        {name}
      </span>
      {signature ? (
        <span
          className={cn(
            "font-display tracking-[0.08em] text-white/42",
            size === "nav" ? "text-[9px]" : "text-[11px]",
          )}
        >
          {signature}
        </span>
      ) : null}
      {supporting ? (
        <span
          className={cn(
            "font-display text-white/38",
            size === "nav" ? "mt-0.5 text-[9px]" : "mt-0.5 text-[11px]",
          )}
        >
          {supporting}
        </span>
      ) : null}
    </span>
  );
}
