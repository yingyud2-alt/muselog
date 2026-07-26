import type { WorkBubble } from "./mood-bubble-data";
import { getBubbleEmotionalMeta } from "./bubble-emotional-meta";
import { MediaIcon } from "./mood-bubble-shared";
import { BUBBLE_TEXT_COLORS, TEXT_COLORS } from "./mood-bubble-visual";

type MobileBubbleContentProps = {
  work: Pick<WorkBubble, "type" | "quote" | "title" | "id" | "creator" | "tags" | "mood">;
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
          className="font-display mt-1 w-full"
          style={{
            fontSize: quoteSize,
            letterSpacing: "0.015em",
            lineHeight: 1.36,
            fontWeight: 700,
            color: isFocus
              ? BUBBLE_TEXT_COLORS.quoteFocused
              : BUBBLE_TEXT_COLORS.quote,
            opacity: 1,
            whiteSpace: "normal",
            overflowWrap: "break-word",
            wordBreak: "normal",
          }}
        >
          &ldquo;{(work.quote?.trim() || work.title)}&rdquo;
        </p>
        <p
          className="font-display mt-1.5 w-full"
          style={{
            fontSize: titleSize,
            lineHeight: 1.3,
            fontWeight: 400,
            color: isFocus
              ? BUBBLE_TEXT_COLORS.titleFocused
              : BUBBLE_TEXT_COLORS.title,
            opacity: 0.68,
            whiteSpace: "normal",
            overflowWrap: "break-word",
            wordBreak: "normal",
          }}
        >
          {work.title}
        </p>
        {work.creator ? (
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
            {work.creator}
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
            {meta.mood}
          </p>
        )}
      </div>
    </div>
  );
}
