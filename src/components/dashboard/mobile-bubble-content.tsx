"use client";

import { useLanguage } from "@/components/i18n/language-provider";
import { translateMoodLabel } from "@/lib/i18n/mood-label";
import { useBubbleLocalizedDisplay } from "@/components/dashboard/use-bubble-localized-display";
import type { WorkBubble } from "./mood-bubble-data";
import { getBubbleEmotionalMeta } from "./bubble-emotional-meta";
import { MediaIcon } from "./mood-bubble-shared";
import { BUBBLE_TEXT_COLORS, TEXT_COLORS } from "./mood-bubble-visual";

type MobileBubbleContentProps = {
  work: Pick<
    WorkBubble,
    | "type"
    | "quote"
    | "title"
    | "id"
    | "creator"
    | "tags"
    | "mood"
    | "workId"
    | "localizedTitle"
    | "localizedCreator"
    | "localizedQuote"
  >;
  diameter: number;
  variant: "featured" | "focus";
};

function scaleFont(diameter: number, min: number, max: number): number {
  const t = Math.min(1, Math.max(0, (diameter - 84) / 22));

  return Math.round(min + (max - min) * t);
}

export function MobileFeaturedBubbleContent({
  work,
  diameter,
  variant,
}: MobileBubbleContentProps) {
  const { t } = useLanguage();
  const display = useBubbleLocalizedDisplay(work);
  const isFocus = variant === "focus";
  const boxRatio = isFocus ? 0.78 : 0.76;
  const boxWidth = diameter * boxRatio;
  const boxMaxHeight = diameter * boxRatio;
  const iconSize = isFocus ? 20 : diameter >= 94 ? 13 : 11;
  const typeSize = isFocus ? 8 : scaleFont(diameter, 7, 8);
  const quoteSize = isFocus ? 16 : scaleFont(diameter, 12, 14.5);
  const titleSize = isFocus ? 11 : scaleFont(diameter, 8, 10);
  const showIcon = isFocus || diameter >= 88;
  const meta = getBubbleEmotionalMeta(work);
  const showLanguageToggle = display.canToggle && diameter >= 100;

  return (
    <div
      className="pointer-events-none flex h-full w-full items-center justify-center rounded-full"
      style={{ padding: diameter * (isFocus ? 0.1 : 0.09) }}
    >
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{
          width: boxWidth,
          maxHeight: boxMaxHeight,
          whiteSpace: "normal",
          overflowWrap: "break-word",
          wordBreak: "normal",
        }}
      >
        {showIcon && (
          <MediaIcon
            type={work.type}
            className="mb-1 shrink-0"
            style={{
              width: iconSize,
              height: iconSize,
              color: TEXT_COLORS.icon,
              opacity: 0.78,
            }}
          />
        )}
        <p
          className={
            display.isZh
              ? "font-bubble-zh-teaser mt-1 w-full"
              : "font-display mt-1 w-full"
          }
          style={{
            fontSize: quoteSize,
            letterSpacing: display.isZh ? "0.01em" : "0.015em",
            lineHeight: display.isZh ? 1.5 : 1.36,
            fontWeight: display.isZh ? 400 : 700,
            color: isFocus
              ? BUBBLE_TEXT_COLORS.quoteFocused
              : BUBBLE_TEXT_COLORS.quote,
            opacity: 1,
            whiteSpace: "normal",
            overflowWrap: "break-word",
            wordBreak: "normal",
          }}
        >
          {display.isZh ? (
            display.teaser
          ) : (
            <>&ldquo;{display.teaser}&rdquo;</>
          )}
        </p>
        <p
          className={
            display.isZh
              ? "font-bubble-zh-title mt-1.5 w-full"
              : "font-display mt-1.5 w-full"
          }
          style={{
            fontSize: titleSize,
            lineHeight: 1.3,
            fontWeight: display.isZh ? 500 : 400,
            color: isFocus
              ? BUBBLE_TEXT_COLORS.titleFocused
              : BUBBLE_TEXT_COLORS.title,
            opacity: 0.68,
            whiteSpace: "normal",
            overflowWrap: "break-word",
            wordBreak: "normal",
          }}
        >
          {display.title}
        </p>
        {display.creator ? (
          <p
            className="font-display mt-0.5 w-full truncate"
            style={{
              fontSize: Math.max(7, titleSize - 1.5),
              lineHeight: 1.2,
              fontWeight: 400,
              color: BUBBLE_TEXT_COLORS.subtitle,
              opacity: isFocus ? 0.7 : 0.55,
            }}
          >
            {display.creator}
          </p>
        ) : null}
        {diameter >= 92 && (
          <p
            className="font-label mt-1 w-full capitalize"
            style={{
              fontSize: Math.max(7, typeSize - 0.5),
              letterSpacing: "0.08em",
              color: BUBBLE_TEXT_COLORS.subtitle,
              opacity: 0.45,
            }}
          >
            {translateMoodLabel(t, meta.mood)}
          </p>
        )}
        {showLanguageToggle ? (
          <span
            role="button"
            tabIndex={0}
            aria-label={t(display.toggleLabelKey)}
            className="pointer-events-auto mt-1 cursor-pointer font-label text-[8px] tracking-[0.08em] text-white/40"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              display.toggle();
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              event.stopPropagation();
              display.toggle();
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
          >
            {t(display.toggleLabelKey)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
