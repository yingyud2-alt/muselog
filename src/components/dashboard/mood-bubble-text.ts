import type { WorkBubble } from "./mood-bubble-data";

export type BubbleTextState =
  | "idle-featured"
  | "focused"
  | "neighbor-featured"
  | "far-featured";

export type FeaturedVisualState = "idle" | "focused" | "neighbor" | "far";

const FEATURED_MIN_DIAMETER: Record<FeaturedVisualState, number> = {
  idle: 148,
  far: 132,
  neighbor: 162,
  focused: 220,
};

const FEATURED_MAX_DIAMETER: Partial<Record<FeaturedVisualState, number>> = {
  far: 148,
  neighbor: 190,
};

export type BubbleTypography = {
  type: number;
  quote: number;
  title: number;
  typeTracking: string;
  quoteTracking: string;
  quoteLineHeight: number;
  titleLineHeight: number;
  typeToQuoteGap: number;
  quoteToTitleGap: number;
  quoteMaxLines: number;
  titleMaxLines: number;
  quoteFontWeight: number;
  titleFontWeight: number;
  typeOpacity: number;
  quoteOpacity: number;
  titleOpacity: number;
};

export type BubbleContentBox = {
  width: number;
  maxHeight: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function titleLengthBonus(title: string): number {
  let bonus = 0;
  const words = title.split(/\s+/);

  if (title.length > 18) {
    bonus += 12;
  }

  if (words.length >= 3) {
    bonus += 8;
  }

  if (words.some((word) => word.length > 10)) {
    bonus += 10;
  }

  return bonus;
}

export function getReadableDiameter(
  work: Pick<WorkBubble, "quote" | "title" | "baseSize">,
  state: BubbleTextState,
): number {
  const quoteLength = work.quote.length;
  const titleBonus = titleLengthBonus(work.title);

  if (state === "idle-featured") {
    let diameter = 148;

    if (quoteLength <= 24) {
      diameter = 148;
    } else if (quoteLength <= 38) {
      diameter = 162;
    } else if (quoteLength <= 52) {
      diameter = 176;
    } else {
      diameter = 190;
    }

    diameter += clamp(titleBonus, 0, 16);

    return clamp(diameter, 148, 202);
  }

  let diameter = 204;

  if (quoteLength <= 28) {
    diameter = 204;
  } else if (quoteLength <= 44) {
    diameter = 220;
  } else if (quoteLength <= 60) {
    diameter = 236;
  } else {
    diameter = 252;
  }

  diameter += clamp(titleBonus, 0, 14);

  return clamp(Math.max(diameter, work.baseSize), 196, 260);
}

export function getIdleFeaturedDiameter(
  work: Pick<WorkBubble, "quote" | "title" | "baseSize">,
): number {
  return Math.max(work.baseSize, getReadableDiameter(work, "idle-featured"));
}

export function getFeaturedVisualState(
  pointerInside: boolean,
  isPrimary: boolean,
  isNeighbor: boolean,
): FeaturedVisualState {
  if (!pointerInside) {
    return "idle";
  }

  if (isPrimary) {
    return "focused";
  }

  if (isNeighbor) {
    return "neighbor";
  }

  return "far";
}

export function featuredStateToTextState(
  state: FeaturedVisualState,
): BubbleTextState {
  switch (state) {
    case "idle":
      return "idle-featured";
    case "focused":
      return "focused";
    case "neighbor":
      return "neighbor-featured";
    case "far":
      return "far-featured";
  }
}

export function getFeaturedTargetDiameter(
  work: Pick<WorkBubble, "quote" | "title" | "baseSize">,
  visualState: FeaturedVisualState,
  scaledDiameter: number,
): number {
  const minimum = FEATURED_MIN_DIAMETER[visualState];
  const maximum = FEATURED_MAX_DIAMETER[visualState];

  if (visualState === "idle") {
    return Math.max(getIdleFeaturedDiameter(work), minimum);
  }

  if (visualState === "focused") {
    return Math.max(getReadableDiameter(work, "focused"), minimum);
  }

  const sized = Math.max(scaledDiameter, minimum);

  if (maximum !== undefined) {
    return clamp(sized, minimum, maximum);
  }

  return sized;
}

export function getContentBox(
  diameter: number,
  state: BubbleTextState,
): BubbleContentBox {
  switch (state) {
    case "idle-featured":
      return {
        width: diameter * 0.74,
        maxHeight: diameter * 0.72,
      };
    case "neighbor-featured":
      return {
        width: diameter * 0.76,
        maxHeight: diameter * 0.74,
      };
    case "far-featured":
      return {
        width: diameter * 0.76,
        maxHeight: diameter * 0.72,
      };
    case "focused":
      return {
        width: diameter * 0.79,
        maxHeight: diameter * 0.78,
      };
  }
}

/** Quote-first hierarchy: quote dominant, title supporting, type muted. */
export function getBubbleTypography(
  diameter: number,
  state: BubbleTextState,
): BubbleTypography {
  if (state === "far-featured") {
    if (diameter < 140) {
      return {
        type: 7.5,
        quote: 12,
        title: 9,
        typeTracking: "0.12em",
        quoteTracking: "0.012em",
        quoteLineHeight: 1.3,
        titleLineHeight: 1.22,
        typeToQuoteGap: 5,
        quoteToTitleGap: 6,
        quoteMaxLines: 4,
        titleMaxLines: 3,
        quoteFontWeight: 700,
        titleFontWeight: 400,
        typeOpacity: 0.36,
        quoteOpacity: 1,
        titleOpacity: 0.62,
      };
    }

    return {
      type: 8,
      quote: 13,
      title: 9.5,
      typeTracking: "0.13em",
      quoteTracking: "0.012em",
      quoteLineHeight: 1.3,
      titleLineHeight: 1.24,
      typeToQuoteGap: 5,
      quoteToTitleGap: 6,
      quoteMaxLines: 4,
      titleMaxLines: 3,
      quoteFontWeight: 700,
      titleFontWeight: 400,
      typeOpacity: 0.38,
      quoteOpacity: 1,
      titleOpacity: 0.64,
    };
  }

  if (state === "neighbor-featured") {
    if (diameter < 172) {
      return {
        type: 8,
        quote: 13.5,
        title: 10,
        typeTracking: "0.14em",
        quoteTracking: "0.014em",
        quoteLineHeight: 1.32,
        titleLineHeight: 1.24,
        typeToQuoteGap: 6,
        quoteToTitleGap: 7,
        quoteMaxLines: 4,
        titleMaxLines: 3,
        quoteFontWeight: 700,
        titleFontWeight: 400,
        typeOpacity: 0.38,
        quoteOpacity: 1,
        titleOpacity: 0.64,
      };
    }

    return {
      type: 8.5,
      quote: 14.5,
      title: 10.5,
      typeTracking: "0.15em",
      quoteTracking: "0.014em",
      quoteLineHeight: 1.34,
      titleLineHeight: 1.25,
      typeToQuoteGap: 6,
      quoteToTitleGap: 7,
      quoteMaxLines: 4,
      titleMaxLines: 3,
      quoteFontWeight: 700,
      titleFontWeight: 400,
      typeOpacity: 0.4,
      quoteOpacity: 1,
      titleOpacity: 0.66,
    };
  }

  if (state === "idle-featured") {
    if (diameter < 165) {
      return {
        type: 8,
        quote: 14,
        title: diameter < 156 ? 9 : 10,
        typeTracking: "0.12em",
        quoteTracking: "0.015em",
        quoteLineHeight: 1.34,
        titleLineHeight: 1.25,
        typeToQuoteGap: 6,
        quoteToTitleGap: 7,
        quoteMaxLines: 4,
        titleMaxLines: 3,
        quoteFontWeight: 700,
        titleFontWeight: 400,
        typeOpacity: 0.36,
        quoteOpacity: 1,
        titleOpacity: 0.64,
      };
    }

    if (diameter < 185) {
      return {
        type: 8,
        quote: 15,
        title: 10,
        typeTracking: "0.14em",
        quoteTracking: "0.015em",
        quoteLineHeight: 1.34,
        titleLineHeight: 1.25,
        typeToQuoteGap: 6,
        quoteToTitleGap: 8,
        quoteMaxLines: 4,
        titleMaxLines: 3,
        quoteFontWeight: 700,
        titleFontWeight: 400,
        typeOpacity: 0.38,
        quoteOpacity: 1,
        titleOpacity: 0.66,
      };
    }

    return {
      type: 8.5,
      quote: 16,
      title: 11,
      typeTracking: "0.16em",
      quoteTracking: "0.016em",
      quoteLineHeight: 1.36,
      titleLineHeight: 1.26,
      typeToQuoteGap: 7,
      quoteToTitleGap: 9,
      quoteMaxLines: 4,
      titleMaxLines: 3,
      quoteFontWeight: 700,
      titleFontWeight: 400,
      typeOpacity: 0.4,
      quoteOpacity: 1,
      titleOpacity: 0.68,
    };
  }

  if (diameter < 220) {
    return {
      type: 8.5,
      quote: 16.5,
      title: 11,
      typeTracking: "0.16em",
      quoteTracking: "0.016em",
      quoteLineHeight: 1.34,
      titleLineHeight: 1.24,
      typeToQuoteGap: 8,
      quoteToTitleGap: 9,
      quoteMaxLines: 5,
      titleMaxLines: 3,
      quoteFontWeight: 700,
      titleFontWeight: 400,
      typeOpacity: 0.4,
      quoteOpacity: 1,
      titleOpacity: 0.7,
    };
  }

  if (diameter < 240) {
    return {
      type: 9,
      quote: 17.5,
      title: 12,
      typeTracking: "0.18em",
      quoteTracking: "0.018em",
      quoteLineHeight: 1.36,
      titleLineHeight: 1.26,
      typeToQuoteGap: 8,
      quoteToTitleGap: 10,
      quoteMaxLines: 5,
      titleMaxLines: 3,
      quoteFontWeight: 700,
      titleFontWeight: 400,
      typeOpacity: 0.42,
      quoteOpacity: 1,
      titleOpacity: 0.72,
    };
  }

  return {
    type: 9.5,
    quote: 18.5,
    title: 12.5,
    typeTracking: "0.2em",
    quoteTracking: "0.018em",
    quoteLineHeight: 1.38,
    titleLineHeight: 1.28,
    typeToQuoteGap: 9,
    quoteToTitleGap: 11,
    quoteMaxLines: 5,
    titleMaxLines: 3,
    quoteFontWeight: 700,
    titleFontWeight: 400,
    typeOpacity: 0.44,
    quoteOpacity: 1,
    titleOpacity: 0.74,
  };
}

export function getFocusedFontSizes(expandedDiameter: number): {
  type: number;
  quote: number;
  title: number;
} {
  if (expandedDiameter >= 240) {
    return { type: 9.5, quote: 18.5, title: 12.5 };
  }

  if (expandedDiameter >= 220) {
    return { type: 9, quote: 17.5, title: 12 };
  }

  if (expandedDiameter >= 196) {
    return { type: 8.5, quote: 16.5, title: 11 };
  }

  return { type: 8.5, quote: 15, title: 11 };
}

export function getContentWidth(baseSize: number): number {
  return baseSize * 0.79;
}

export function getContentMaxHeight(baseSize: number): number {
  return baseSize * 0.79;
}
