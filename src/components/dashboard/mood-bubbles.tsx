"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useMotionValue } from "framer-motion";

import { openBubblePreview } from "@/lib/work/open-bubble-preview";
import { getWorkBubblesForContainer, type WorkBubble } from "./mood-bubble-data";
import { MobileBubbleExperience } from "./mobile-bubble-experience";
import {
  BubbleContent,
  MediaIcon,
} from "./mood-bubble-shared";
import { BubbleAiMoodLabel } from "./bubble-ai-mood-label";
import { BubbleMemoryIndicator } from "./bubble-memory-indicator";
import { SurpriseMuseButton } from "./surprise-muse-button";
import {
  applyDesktopBubbleFieldOffset,
  computeFocusOffsets,
  DESKTOP_BUBBLE_CANVAS_TOP,
  DESKTOP_BUBBLE_FIELD_OFFSET_Y,
  DESKTOP_BUBBLE_BOTTOM_RESERVE,
  DESKTOP_BUBBLE_NAV_SAFE_Y,
  DESKTOP_FEATURED_SIZE_SCALE,
  findFocusCluster,
  getBubbleDrift,
  getBubbleOpacity,
  getBubbleScale,
  packWorkBubbles,
  type BubbleOffset,
  type FocusCluster,
  type PlacedBubble,
} from "./mood-bubble-layout";
import {
  featuredStateToTextState,
  getFeaturedTargetDiameter,
  getFeaturedVisualState,
  getIdleFeaturedDiameter,
  type BubbleTextState,
} from "./mood-bubble-text";
import {
  getBubbleBackground,
  getBubbleBorder,
  getBubbleGlow,
  getBubbleVisualState,
  MOONLIGHT_GRADIENT,
  PAPER_NOISE_DATA_URL,
  PAPER_NOISE_OPACITY,
  TEXT_COLORS,
} from "./mood-bubble-visual";
import { cn } from "@/lib/utils";

const BUBBLE_TRANSITION = {
  type: "spring" as const,
  stiffness: 680,
  damping: 38,
  mass: 0.78,
};

const EMPTY_CLUSTER: FocusCluster = {
  primaryIndex: null,
  neighborIndices: [],
};

type PointerState = {
  x: number;
  y: number;
  inside: boolean;
};

function clustersEqual(
  left: FocusCluster,
  right: FocusCluster,
): boolean {
  if (left.primaryIndex !== right.primaryIndex) {
    return false;
  }

  if (left.neighborIndices.length !== right.neighborIndices.length) {
    return false;
  }

  return left.neighborIndices.every(
    (index, position) => index === right.neighborIndices[position],
  );
}

function getTargetDiameter(
  bubble: PlacedBubble,
  cluster: FocusCluster,
  index: number,
  pointerInside: boolean,
): number {
  const isPrimary = cluster.primaryIndex === index;
  const isNeighbor = cluster.neighborIndices.includes(index);

  if (bubble.alwaysVisible) {
    const visualState = getFeaturedVisualState(
      pointerInside,
      isPrimary,
      isNeighbor,
    );
    const scaledDiameter = pointerInside
      ? bubble.baseSize *
        getBubbleScale(bubble, cluster, index, pointerInside)
      : getIdleFeaturedDiameter(bubble);

    return getFeaturedTargetDiameter(bubble, visualState, scaledDiameter);
  }

  if (!pointerInside) {
    return bubble.baseSize;
  }

  return bubble.baseSize * getBubbleScale(bubble, cluster, index, pointerInside);
}

function capDiameterForCanvasTop(
  bubble: PlacedBubble,
  diameter: number,
): number {
  const maxDiameter = (bubble.y - DESKTOP_BUBBLE_NAV_SAFE_Y) * 2;

  if (maxDiameter >= diameter) {
    return diameter;
  }

  return Math.max(maxDiameter, bubble.baseSize * 0.9);
}

function getDesktopTargetDiameter(
  bubble: PlacedBubble,
  cluster: FocusCluster,
  index: number,
  pointerInside: boolean,
): number {
  return capDiameterForCanvasTop(
    bubble,
    getTargetDiameter(bubble, cluster, index, pointerInside),
  );
}

type BubbleNodeProps = {
  bubble: PlacedBubble;
  index: number;
  cluster: FocusCluster;
  offsets: Map<number, BubbleOffset>;
  pointerInside: boolean;
  nudgeX: ReturnType<typeof useMotionValue<number>>;
  nudgeY: ReturnType<typeof useMotionValue<number>>;
  onSelect: (work: WorkBubble) => void;
};

function BubbleNode({
  bubble,
  index,
  cluster,
  offsets,
  pointerInside,
  nudgeX,
  nudgeY,
  onSelect,
}: BubbleNodeProps) {
  const isPrimary = cluster.primaryIndex === index;
  const isNeighbor = cluster.neighborIndices.includes(index);

  const opacity = useMemo(
    () => getBubbleOpacity(bubble, cluster, index, pointerInside),
    [bubble, cluster, index, pointerInside],
  );

  const zIndex = isPrimary
    ? 50
    : isNeighbor
      ? 44 - cluster.neighborIndices.indexOf(index)
      : bubble.alwaysVisible
        ? 16
        : 10;

  const offset = offsets.get(index) ?? { dx: 0, dy: 0 };

  const targetDiameter = useMemo(
    () => getDesktopTargetDiameter(bubble, cluster, index, pointerInside),
    [bubble, cluster, index, pointerInside],
  );

  const isPrimaryFocused = isPrimary && pointerInside;
  const isFeatured = bubble.alwaysVisible;
  /** Featured idle + any hover-primary bubble reveal full editorial content */
  const showExpandedContent = isFeatured || isPrimaryFocused;
  /** Small / neighbor / far bubbles stay icon-only */
  const showMinimalIcon = !showExpandedContent;

  const featuredVisualState = isFeatured
    ? getFeaturedVisualState(pointerInside, isPrimary, isNeighbor)
    : null;

  const contentState: BubbleTextState = isFeatured && featuredVisualState
    ? featuredStateToTextState(featuredVisualState)
    : "focused";

  const visualState = getBubbleVisualState(
    isFeatured,
    pointerInside,
    isPrimary,
    isNeighbor,
  );

  const bubbleBackground = getBubbleBackground(bubble.color);
  const bubbleBorder = getBubbleBorder(visualState);
  const bubbleGlow = getBubbleGlow(bubble.color, visualState);

  const targetLeft = bubble.x - targetDiameter / 2;
  const targetTop = bubble.y - targetDiameter / 2;

  const drift = useMemo(() => getBubbleDrift(bubble.id), [bubble.id]);

  const driftKeyframes = useMemo(
    () => ({
      x: [
        0,
        drift.amplitude,
        -drift.amplitude * 0.6,
        drift.amplitude * 0.35,
        0,
      ],
      y: [
        0,
        -drift.amplitude * 0.85,
        drift.amplitude * 0.55,
        -drift.amplitude * 0.35,
        0,
      ],
    }),
    [drift.amplitude],
  );

  return (
    <motion.button
      type="button"
      aria-label={`${bubble.title}, ${bubble.type}`}
      onClick={() => onSelect(bubble)}
      className={cn(
        "absolute flex items-center justify-center rounded-full text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
      )}
      style={{
        border: bubbleBorder,
        zIndex,
        ...(isPrimary ? { x: nudgeX, y: nudgeY } : {}),
      }}
      initial={false}
      animate={{
        width: targetDiameter,
        height: targetDiameter,
        left: targetLeft,
        top: targetTop,
        opacity,
        background: bubbleBackground,
        boxShadow: bubbleGlow,
        ...(isPrimary
          ? pointerInside
            ? {}
            : driftKeyframes
          : pointerInside
            ? {
                x: offset.dx,
                y: offset.dy,
              }
            : driftKeyframes),
      }}
      transition={
        isPrimary || pointerInside
          ? BUBBLE_TRANSITION
          : {
              x: {
                duration: drift.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: drift.phaseX * 2,
              },
              y: {
                duration: drift.duration * 0.92,
                repeat: Infinity,
                ease: "easeInOut",
                delay: drift.phaseY * 2,
              },
              default: BUBBLE_TRANSITION,
            }
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          opacity: PAPER_NOISE_OPACITY,
          backgroundImage: PAPER_NOISE_DATA_URL,
          mixBlendMode: "soft-light",
        }}
      />
      <BubbleMemoryIndicator work={bubble} />
      {showExpandedContent && (
        <BubbleContent
          work={bubble}
          state={contentState}
          diameter={targetDiameter}
          showMood={isFeatured}
          reveal={isPrimaryFocused && !isFeatured}
        />
      )}

      {showMinimalIcon && (
        <MediaIcon
          type={bubble.type}
          className="pointer-events-none"
          style={{
            width: Math.max(11, Math.min(15, targetDiameter * 0.28)),
            height: Math.max(11, Math.min(15, targetDiameter * 0.28)),
            color: TEXT_COLORS.icon,
            opacity: isNeighbor && pointerInside ? 0.66 : 0.52,
          }}
        />
      )}
    </motion.button>
  );
}

export default function MoodBubbles() {
  return (
    <>
      <MobileBubbleExperience />
      <div className="hidden md:block">
        <DesktopBubbleHero />
      </div>
    </>
  );
}

function DesktopBubbleHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<PointerState>({ x: 0, y: 0, inside: false });
  const rafRef = useRef<number>(0);
  const clusterRef = useRef<FocusCluster>(EMPTY_CLUSTER);
  const measuredSizeRef = useRef({ width: 0, height: 0 });

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [cluster, setCluster] = useState<FocusCluster>(EMPTY_CLUSTER);
  const [offsets, setOffsets] = useState<Map<number, BubbleOffset>>(new Map());
  const [pointerInside, setPointerInside] = useState(false);

  const primaryNudgeX = useMotionValue(0);
  const primaryNudgeY = useMotionValue(0);

  const layout = useMemo(() => {
    const works = getWorkBubblesForContainer(containerSize.width);
    const scaledWorks = works.map((work) => ({
      ...work,
      baseSize: work.alwaysVisible
        ? Math.round(work.baseSize * DESKTOP_FEATURED_SIZE_SCALE)
        : work.baseSize,
    }));

    const packed = packWorkBubbles(
      scaledWorks,
      containerSize.width,
      containerSize.height,
    );

    return applyDesktopBubbleFieldOffset(packed, DESKTOP_BUBBLE_FIELD_OFFSET_Y);
  }, [containerSize.height, containerSize.width]);

  const updateInteraction = useCallback(() => {
    const pointer = pointerRef.current;

    if (!pointer.inside || layout.length === 0) {
      primaryNudgeX.set(0);
      primaryNudgeY.set(0);

      if (clusterRef.current.primaryIndex !== null) {
        clusterRef.current = EMPTY_CLUSTER;
        setCluster(EMPTY_CLUSTER);
        setOffsets(new Map());
      }

      return;
    }

    const nextCluster = findFocusCluster(layout, pointer.x, pointer.y);
    const nextOffsets = computeFocusOffsets(layout, nextCluster, true);

    if (nextCluster.primaryIndex !== null) {
      const primary = layout[nextCluster.primaryIndex];
      const dx = pointer.x - primary.x;
      const dy = pointer.y - primary.y;
      const distance = Math.hypot(dx, dy);
      const strength = Math.min(distance * 0.1, 12);

      if (distance > 0) {
        primaryNudgeX.set((dx / distance) * strength);
        primaryNudgeY.set((dy / distance) * strength);
      } else {
        primaryNudgeX.set(0);
        primaryNudgeY.set(0);
      }
    }

    if (!clustersEqual(clusterRef.current, nextCluster)) {
      clusterRef.current = nextCluster;
      setCluster(nextCluster);
    }

    setOffsets(nextOffsets);
  }, [layout, primaryNudgeX, primaryNudgeY]);

  const queueInteractionUpdate = useCallback(() => {
    if (rafRef.current !== 0) {
      return;
    }

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      updateInteraction();
    });
  }, [updateInteraction]);

  useEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return;
    }

    const measure = () => {
      const rect = node.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.max(
        Math.round(rect.height) -
          DESKTOP_BUBBLE_CANVAS_TOP -
          DESKTOP_BUBBLE_BOTTOM_RESERVE,
        720,
      );

      if (
        measuredSizeRef.current.width === width &&
        measuredSizeRef.current.height === height
      ) {
        return;
      }

      measuredSizeRef.current = { width, height };
      clusterRef.current = EMPTY_CLUSTER;
      pointerRef.current = { x: 0, y: 0, inside: false };
      primaryNudgeX.set(0);
      primaryNudgeY.set(0);
      setCluster(EMPTY_CLUSTER);
      setOffsets(new Map());
      setPointerInside(false);
      setContainerSize({ width, height });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);

    return () => {
      observer.disconnect();

      if (rafRef.current !== 0) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [primaryNudgeX, primaryNudgeY]);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    pointerRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      inside: true,
    };

    if (!pointerInside) {
      setPointerInside(true);
    }

    queueInteractionUpdate();
  };

  const handlePointerLeave = () => {
    pointerRef.current = { x: 0, y: 0, inside: false };
    setPointerInside(false);
    clusterRef.current = EMPTY_CLUSTER;
    setCluster(EMPTY_CLUSTER);
    setOffsets(new Map());
    primaryNudgeX.set(0);
    primaryNudgeY.set(0);
  };

  const handleSelect = (work: WorkBubble) => {
    openBubblePreview(work);
  };

  const handlePointerEnter = (event: React.PointerEvent<HTMLElement>) => {
    handlePointerMove(event);
  };

  return (
    <section
      ref={containerRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative h-[min(100svh,960px)] min-h-[820px] w-full overflow-hidden"
      style={{ paddingTop: DESKTOP_BUBBLE_CANVAS_TOP }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: MOONLIGHT_GRADIENT }}
      />
      {layout.map((bubble, index) => (
        <BubbleNode
          key={bubble.id}
          bubble={bubble}
          index={index}
          cluster={cluster}
          offsets={offsets}
          pointerInside={pointerInside}
          nudgeX={primaryNudgeX}
          nudgeY={primaryNudgeY}
          onSelect={handleSelect}
        />
      ))}

      <BubbleAiMoodLabel />

      <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
        <div className="w-full max-w-[min(92vw,640px)] px-4 text-center md:max-w-[720px]">
          <h2
            className="font-hero text-[28px] font-medium sm:text-[32px] md:whitespace-nowrap md:text-[34px] xl:text-[36px] 2xl:text-[40px]"
            style={{
              color: TEXT_COLORS.heading,
              letterSpacing: "-0.025em",
              lineHeight: 1.08,
              textShadow: "0 8px 32px rgba(13,17,23,0.55)",
            }}
          >
            What inspires you today?
          </h2>
          <p
            className="font-display whitespace-nowrap text-[13px] font-normal md:text-[14px]"
            style={{
              color: TEXT_COLORS.subtitle,
              marginTop: 12,
            }}
          >
            Discover something that matches your mood
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center md:bottom-10">
        <div className="pointer-events-auto">
          <SurpriseMuseButton />
        </div>
      </div>

    </section>
  );
}
