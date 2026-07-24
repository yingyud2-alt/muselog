import type { WorkBubble } from "./mood-bubble-data";
import { MediaIcon } from "./mood-bubble-shared";
import { TEXT_COLORS } from "./mood-bubble-visual";

type MobileBubbleContentProps = {
  work: Pick<WorkBubble, "type" | "quote" | "title">;
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
  const typeSize = isFocus ? 8.5 : scaleFont(diameter, 7, 8);
  const quoteSize = isFocus ? 14 : scaleFont(diameter, 10, 12);
  const titleSize = isFocus ? 11 : scaleFont(diameter, 8, 10);
  const showIcon = isFocus || diameter >= 88;

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
          className="w-full uppercase"
          style={{
            fontSize: typeSize,
            letterSpacing: "0.14em",
            lineHeight: 1.25,
            color: TEXT_COLORS.type,
            opacity: 0.5,
          }}
        >
          {work.type}
        </p>
        <p
          className="mt-1 w-full italic"
          style={{
            fontSize: quoteSize,
            lineHeight: 1.32,
            fontWeight: 500,
            color: isFocus ? TEXT_COLORS.quoteFocused : TEXT_COLORS.quote,
            opacity: 0.94,
            whiteSpace: "normal",
            overflowWrap: "break-word",
            wordBreak: "normal",
          }}
        >
          &ldquo;{work.quote}&rdquo;
        </p>
        <p
          className="mt-1.5 w-full"
          style={{
            fontSize: titleSize,
            lineHeight: 1.3,
            fontWeight: 400,
            color: isFocus ? TEXT_COLORS.titleFocused : TEXT_COLORS.title,
            opacity: 0.78,
            whiteSpace: "normal",
            overflowWrap: "break-word",
            wordBreak: "normal",
          }}
        >
          {work.title}
        </p>
      </div>
    </div>
  );
}
