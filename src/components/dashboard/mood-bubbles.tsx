"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import {
  BookOpen,
  Film,
  Headphones,
  Mic,
  Plus,
  Tv,
  X,
  type LucideIcon,
} from "lucide-react";

import { getWorkBubblesForContainer, type MediaType, type WorkBubble } from "./mood-bubble-data";
import { MobileBubbleExperience } from "./mobile-bubble-experience";
import {
  computeFocusOffsets,
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
  getBubbleTypography,
  getContentBox,
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
  getModalStyles,
  MOONLIGHT_GRADIENT,
  PAPER_NOISE_DATA_URL,
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

const MEDIA_ICONS: Record<MediaType, LucideIcon> = {
  BOOK: BookOpen,
  MOVIE: Film,
  MUSIC: Headphones,
  PODCAST: Mic,
  TV: Tv,
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

function MediaIcon({
  type,
  className,
  style,
}: {
  type: MediaType;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = MEDIA_ICONS[type];

  return <Icon className={className} style={style} aria-hidden="true" />;
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

type BubbleContentProps = {
  work: PlacedBubble;
  state: BubbleTextState;
  diameter: number;
};

function BubbleContent({ work, state, diameter }: BubbleContentProps) {
  const typography = getBubbleTypography(diameter, state);
  const contentBox = getContentBox(diameter, state);
  const isFocused = state === "focused";

  return (
    <div className="pointer-events-none flex h-full w-full items-center justify-center overflow-hidden rounded-full">
      <div
        className="flex min-h-0 min-w-0 flex-col items-center justify-center text-center leading-snug"
        style={{
          width: contentBox.width,
          maxHeight: contentBox.maxHeight,
          margin: "auto",
        }}
      >
        <p
          className="w-full whitespace-normal uppercase"
          style={{
            fontSize: typography.type,
            letterSpacing: typography.typeTracking,
            lineHeight: 1.2,
            color: TEXT_COLORS.type,
            opacity: typography.typeOpacity,
          }}
        >
          {work.type}
        </p>
        <p
          className="w-full whitespace-normal break-words italic [overflow-wrap:anywhere]"
          style={{
            marginTop: typography.typeToQuoteGap,
            fontSize: typography.quote,
            lineHeight: typography.quoteLineHeight,
            fontWeight: typography.quoteFontWeight,
            color: isFocused ? TEXT_COLORS.quoteFocused : TEXT_COLORS.quote,
            opacity: typography.quoteOpacity,
            maxHeight:
              typography.quote *
              typography.quoteLineHeight *
              typography.quoteMaxLines,
            overflow: "hidden",
          }}
        >
          &ldquo;{work.quote}&rdquo;
        </p>
        <p
          className="w-full whitespace-normal break-words [overflow-wrap:anywhere]"
          style={{
            marginTop: typography.quoteToTitleGap,
            fontSize: typography.title,
            lineHeight: typography.titleLineHeight,
            fontWeight: typography.titleFontWeight,
            color: isFocused ? TEXT_COLORS.titleFocused : TEXT_COLORS.title,
            opacity: typography.titleOpacity,
            maxHeight:
              typography.title *
              typography.titleLineHeight *
              typography.titleMaxLines,
            overflow: "hidden",
          }}
        >
          {work.title}
        </p>
      </div>
    </div>
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
    () => getTargetDiameter(bubble, cluster, index, pointerInside),
    [bubble, cluster, index, pointerInside],
  );

  const isPrimaryFocused = isPrimary && pointerInside;
  const isFeatured = bubble.alwaysVisible;
  const showFullContent = isFeatured || isPrimaryFocused;
  const showIconOnly =
    !isFeatured && isNeighbor && pointerInside && !isPrimaryFocused;

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
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
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
          opacity: 0.03,
          backgroundImage: PAPER_NOISE_DATA_URL,
          mixBlendMode: "overlay",
        }}
      />
      {showFullContent && (
        <BubbleContent
          work={bubble}
          state={contentState}
          diameter={targetDiameter}
        />
      )}

      {showIconOnly && (
        <MediaIcon
          type={bubble.type}
          className="pointer-events-none size-3"
          style={{ color: TEXT_COLORS.icon, opacity: 0.66 }}
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
  const [selected, setSelected] = useState<WorkBubble | null>(null);

  const primaryNudgeX = useMotionValue(0);
  const primaryNudgeY = useMotionValue(0);

  const layout = useMemo(() => {
    const works = getWorkBubblesForContainer(containerSize.width);

    return packWorkBubbles(works, containerSize.width, containerSize.height);
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
      const height = Math.round(rect.height);

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
    setSelected(work);
  };

  const handlePointerEnter = (event: React.PointerEvent<HTMLElement>) => {
    handlePointerMove(event);
  };

  const selectedModalStyles = selected
    ? getModalStyles(selected.color)
    : null;

  return (
    <section
      ref={containerRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative h-[min(88vh,960px)] min-h-[860px] w-full overflow-hidden"
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

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="max-w-[380px] px-4 text-center">
          <h2
            className="text-[34px] font-medium md:text-[36px] 2xl:text-[40px]"
            style={{
              color: TEXT_COLORS.heading,
              letterSpacing: "-0.025em",
              lineHeight: 1.08,
            }}
          >
            What inspires you today?
          </h2>
          <p
            className="text-[14px] font-normal md:text-[15px]"
            style={{
              color: TEXT_COLORS.subtitle,
              marginTop: 13,
            }}
          >
            Discover something that matches your mood
          </p>
        </div>
      </div>

      <AnimatePresence>
        {selected && selectedModalStyles && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              onClick={(event) => event.stopPropagation()}
              className="relative w-[360px] rounded-3xl p-8 text-center text-white backdrop-blur-2xl"
              style={{
                background: selectedModalStyles.background,
                border: selectedModalStyles.border,
                boxShadow: selectedModalStyles.boxShadow,
              }}
            >
              <button
                type="button"
                aria-label="Close recommendation"
                className="absolute right-5 top-5 opacity-70 transition-opacity hover:opacity-100"
                style={{ color: TEXT_COLORS.icon }}
                onClick={() => setSelected(null)}
              >
                <X size={18} />
              </button>

              <div
                className="flex h-44 items-center justify-center rounded-2xl"
                style={{ background: selectedModalStyles.coverBackground }}
              >
                <MediaIcon
                  type={selected.type}
                  className="size-[50px]"
                  style={{ color: TEXT_COLORS.icon, opacity: 0.82 }}
                />
              </div>

              <p
                className="mt-6 text-xs uppercase"
                style={{
                  color: TEXT_COLORS.type,
                  letterSpacing: "0.18em",
                  opacity: 0.48,
                }}
              >
                {selected.type}
              </p>

              <h3
                className="mt-3 text-3xl font-semibold"
                style={{ color: TEXT_COLORS.titleFocused }}
              >
                {selected.title}
              </h3>

              <p
                className="mt-2 text-sm"
                style={{ color: TEXT_COLORS.subtitle }}
              >
                {selected.creator}
              </p>

              <p
                className="mt-5 text-[15px] italic leading-snug"
                style={{
                  color: TEXT_COLORS.quoteFocused,
                  fontWeight: 500,
                }}
              >
                &ldquo;{selected.quote}&rdquo;
              </p>

              <button
                type="button"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-white/95 py-3 text-black transition-colors hover:bg-white"
              >
                <Plus size={18} />
                Add to journal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
