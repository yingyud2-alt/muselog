"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

import { openBubblePreview } from "@/lib/work/open-bubble-preview";
import { getWorkBubblesForContainer, type WorkBubble } from "./mood-bubble-data";
import { MobileFeaturedBubbleContent } from "./mobile-bubble-content";
import { BubbleAiMoodLabel } from "./bubble-ai-mood-label";
import { BubbleMemoryIndicator } from "./bubble-memory-indicator";
import {
  clampMobileBubbleCenter,
  computeMobileFocusOffsets,
  findBubbleIndexAtPoint,
  getFocusPointFromTouch,
  getMobileBubbleBounds,
  getMobileFocusCenter,
  getMobileFocusDiameter,
  packMobileBubbles,
} from "./mood-bubble-mobile-layout";
import {
  getBubbleDrift,
  type BubbleOffset,
  type FocusCluster,
  type PlacedBubble,
} from "./mood-bubble-layout";
import { MediaIcon } from "./mood-bubble-shared";
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

const MOBILE_TRANSITION = {
  type: "spring" as const,
  stiffness: 400,
  damping: 32,
  mass: 0.9,
};

const LONG_PRESS_MS = 400;
const MOVE_CANCEL_THRESHOLD = 10;
const GHOST_CLICK_GUARD_MS = 80;

type GesturePhase = "idle" | "pressing" | "dragging" | "locked";

function getMobileDriftDuration(bubbleId: number): number {
  const seed = bubbleId * 97;

  return 8 + (Math.abs(seed) % 5);
}

type LockedFocusedBubbleProps = {
  bubble: PlacedBubble;
  left: number;
  top: number;
  diameter: number;
  bubbleBackground: string;
  bubbleBorder: string;
  bubbleGlow: string;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onOpenModal: () => void;
  onDismiss: () => void;
};

function LockedFocusedBubble({
  bubble,
  left,
  top,
  diameter,
  bubbleBackground,
  bubbleBorder,
  bubbleGlow,
  containerRef,
  onOpenModal,
  onDismiss,
}: LockedFocusedBubbleProps) {
  const mediaType = bubble.type.toLowerCase();

  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ zIndex: 70 }}
      initial={false}
      animate={{ left, top, width: diameter, height: diameter, opacity: 1 }}
      transition={MOBILE_TRANSITION}
    >
      <motion.div
        ref={containerRef}
        role="button"
        tabIndex={0}
        aria-label={`Open ${mediaType} ${bubble.title}`}
        onClick={(event) => {
          event.stopPropagation();
          onOpenModal();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenModal();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            onDismiss();
          }
        }}
        className={cn(
          "pointer-events-auto absolute inset-0 flex items-center justify-center rounded-full text-white",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
          "touch-manipulation select-none",
        )}
        style={{
          border: bubbleBorder,
          background: bubbleBackground,
          boxShadow: bubbleGlow,
          overflow: "visible",
          touchAction: "none",
        }}
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
        <div className="pointer-events-none">
          <MobileFeaturedBubbleContent
            work={bubble}
            diameter={diameter}
            variant="focus"
          />
        </div>
      </motion.div>
      <button
        type="button"
        aria-label="Close focused recommendation"
        onClick={(event) => {
          event.stopPropagation();
          onDismiss();
        }}
        onPointerDown={(event) => event.stopPropagation()}
        className="pointer-events-auto absolute -right-0.5 -top-0.5 z-[2] flex size-8 items-center justify-center rounded-full bg-black/35 text-white/80 backdrop-blur-sm"
      >
        <X size={14} strokeWidth={2.2} />
      </button>
    </motion.div>
  );
}

type IdleBubbleProps = {
  bubble: PlacedBubble;
  left: number;
  top: number;
  diameter: number;
  opacity: number;
  isFeatured: boolean;
  isFocusActive: boolean;
  showFocusContent?: boolean;
  bubbleBackground: string;
  bubbleBorder: string;
  bubbleGlow: string;
  driftDuration: number;
  drift: { amplitude: number };
};

function IdleBubble({
  bubble,
  left,
  top,
  diameter,
  opacity,
  isFeatured,
  isFocusActive,
  showFocusContent = false,
  bubbleBackground,
  bubbleBorder,
  bubbleGlow,
  driftDuration,
  drift,
}: IdleBubbleProps) {
  const showFeaturedIdle = isFeatured && !isFocusActive && !showFocusContent;
  const iconSize =
    diameter >= 48 ? "size-3.5" : diameter >= 30 ? "size-3" : "size-2.5";

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute flex items-center justify-center rounded-full text-white"
      style={{
        border: bubbleBorder,
        zIndex: isFeatured ? 16 : 10,
        overflow: "hidden",
      }}
      initial={false}
      animate={{
        width: diameter,
        height: diameter,
        left,
        top,
        opacity,
        background: bubbleBackground,
        boxShadow: bubbleGlow,
        x: !isFocusActive
          ? [0, drift.amplitude * 0.55, -drift.amplitude * 0.35, 0]
          : 0,
        y: !isFocusActive
          ? [0, -drift.amplitude * 0.42, drift.amplitude * 0.28, 0]
          : 0,
      }}
      transition={
        isFocusActive
          ? MOBILE_TRANSITION
          : {
              x: {
                duration: driftDuration,
                repeat: Infinity,
                ease: "easeInOut",
              },
              y: {
                duration: driftDuration * 0.95,
                repeat: Infinity,
                ease: "easeInOut",
              },
              default: MOBILE_TRANSITION,
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
      {showFocusContent ? (
        <MobileFeaturedBubbleContent
          work={bubble}
          diameter={diameter}
          variant="focus"
        />
      ) : showFeaturedIdle ? (
        <MobileFeaturedBubbleContent
          work={bubble}
          diameter={diameter}
          variant="featured"
        />
      ) : (
        <MediaIcon
          type={bubble.type}
          className={cn("pointer-events-none", iconSize)}
          style={{
            color: TEXT_COLORS.icon,
            opacity: 0.46,
          }}
        />
      )}
    </motion.div>
  );
}

export function MobileBubbleExperience() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const lockedBubbleRef = useRef<HTMLDivElement>(null);
  const measuredSizeRef = useRef({ width: 0, height: 0 });
  const longPressTimerRef = useRef<number | null>(null);
  const didLongPressRef = useRef(false);
  const ghostClickResetTimerRef = useRef<number | null>(null);
  const pointerDownWorkIdRef = useRef<number | null>(null);
  const pointerStartRef = useRef({
    x: 0,
    y: 0,
    time: 0,
    pointerId: null as number | null,
  });

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [mobileFocusedId, setMobileFocusedId] = useState<number | null>(null);
  const [gesturePhase, setGesturePhase] = useState<GesturePhase>("idle");
  const [offsets, setOffsets] = useState<Map<number, BubbleOffset>>(new Map());

  const isMobileFocusLocked = gesturePhase === "locked";
  const isDraggingFocus = gesturePhase === "dragging";

  const layout = useMemo(() => {
    const works = getWorkBubblesForContainer(canvasSize.width);

    return packMobileBubbles(works, canvasSize.width, canvasSize.height);
  }, [canvasSize.height, canvasSize.width]);

  const bubbleBounds = useMemo(
    () => getMobileBubbleBounds(canvasSize.width, canvasSize.height),
    [canvasSize.height, canvasSize.width],
  );

  const focusCenter = useMemo(
    () => getMobileFocusCenter(bubbleBounds),
    [bubbleBounds],
  );

  const focusedIndex = useMemo(() => {
    if (mobileFocusedId === null) {
      return null;
    }

    const index = layout.findIndex((bubble) => bubble.id === mobileFocusedId);

    return index >= 0 ? index : null;
  }, [layout, mobileFocusedId]);

  const isFocusActive = mobileFocusedId !== null;

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const guardGhostClickFromLongPress = useCallback(() => {
    didLongPressRef.current = true;

    if (ghostClickResetTimerRef.current !== null) {
      window.clearTimeout(ghostClickResetTimerRef.current);
    }

    requestAnimationFrame(() => {
      ghostClickResetTimerRef.current = window.setTimeout(() => {
        didLongPressRef.current = false;
        ghostClickResetTimerRef.current = null;
      }, GHOST_CLICK_GUARD_MS);
    });
  }, []);

  const clearMobileFocus = useCallback(() => {
    clearLongPressTimer();
    setGesturePhase("idle");
    setMobileFocusedId(null);
    setOffsets(new Map());
    pointerDownWorkIdRef.current = null;
    pointerStartRef.current.pointerId = null;
  }, [clearLongPressTimer]);

  const applyFocusToIndex = useCallback(
    (index: number) => {
      const bubble = layout[index];

      if (!bubble) {
        return;
      }

      const nextCluster: FocusCluster = {
        primaryIndex: index,
        neighborIndices: [],
      };
      const nextOffsets = computeMobileFocusOffsets(
        layout,
        nextCluster,
        focusCenter,
        getMobileFocusDiameter(bubble),
      );

      setMobileFocusedId(bubble.id);
      setOffsets(nextOffsets);
    },
    [focusCenter, layout],
  );

  const applyFocusAtPoint = useCallback(
    (x: number, y: number) => {
      if (layout.length === 0) {
        return;
      }

      const point = getFocusPointFromTouch(layout, x, y);
      const index = layout.findIndex(
        (bubble) =>
          Math.hypot(point.x - bubble.x, point.y - bubble.y) <=
          bubble.baseSize / 2,
      );

      if (index >= 0) {
        applyFocusToIndex(index);
      }
    },
    [applyFocusToIndex, layout],
  );

  const lockFocusToIndex = useCallback(
    (index: number) => {
      applyFocusToIndex(index);
      setGesturePhase("locked");
    },
    [applyFocusToIndex],
  );

  const openWorkModal = useCallback(
    (work: WorkBubble) => {
      openBubblePreview(work);
      requestAnimationFrame(() => {
        clearMobileFocus();
      });
    },
    [clearMobileFocus],
  );

  const getCanvasPoint = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();

    if (!rect) {
      return null;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  useEffect(() => {
    const node = canvasRef.current;

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
      clearMobileFocus();
      setCanvasSize({ width, height });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);

    return () => {
      observer.disconnect();
      clearLongPressTimer();

      if (ghostClickResetTimerRef.current !== null) {
        window.clearTimeout(ghostClickResetTimerRef.current);
      }
    };
  }, [clearLongPressTimer, clearMobileFocus]);

  useEffect(() => {
    if (!isMobileFocusLocked) {
      return;
    }

    lockedBubbleRef.current?.focus({ preventScroll: true });

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearMobileFocus();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [clearMobileFocus, isMobileFocusLocked, mobileFocusedId]);

  const activateLongPressFocus = useCallback(
    (clientX: number, clientY: number, index: number | null) => {
      setGesturePhase("dragging");
      setMobileFocusedId(null);

      if (index !== null) {
        applyFocusToIndex(index);
      } else {
        const point = getCanvasPoint(clientX, clientY);

        if (point) {
          applyFocusAtPoint(point.x, point.y);
        }
      }
    },
    [applyFocusAtPoint, applyFocusToIndex, getCanvasPoint],
  );

  const beginLongPress = useCallback(
    (clientX: number, clientY: number, index: number | null) => {
      clearLongPressTimer();
      setGesturePhase("pressing");

      longPressTimerRef.current = window.setTimeout(() => {
        activateLongPressFocus(clientX, clientY, index);
      }, LONG_PRESS_MS);
    },
    [activateLongPressFocus, clearLongPressTimer],
  );

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const point = getCanvasPoint(event.clientX, event.clientY);
    const index = point ? findBubbleIndexAtPoint(layout, point.x, point.y) : null;

    if (isMobileFocusLocked) {
      if (index === null) {
        clearMobileFocus();
        return;
      }

      if (layout[index]?.id !== mobileFocusedId) {
        lockFocusToIndex(index);
      }

      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now(),
      pointerId: event.pointerId,
    };
    pointerDownWorkIdRef.current = index !== null ? layout[index].id : null;

    beginLongPress(event.clientX, event.clientY, index);
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const start = pointerStartRef.current;

    if (start.pointerId !== event.pointerId) {
      return;
    }

    const moved = Math.hypot(
      event.clientX - start.x,
      event.clientY - start.y,
    );

    if (gesturePhase === "dragging") {
      event.preventDefault();
      const point = getCanvasPoint(event.clientX, event.clientY);

      if (point) {
        applyFocusAtPoint(point.x, point.y);
      }

      return;
    }

    if (gesturePhase === "pressing" && moved > MOVE_CANCEL_THRESHOLD) {
      clearLongPressTimer();
      setGesturePhase("idle");
    }
  };

  const handleCanvasPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (pointerStartRef.current.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    clearLongPressTimer();

    const start = pointerStartRef.current;
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    const duration = Date.now() - start.time;

    if (gesturePhase === "dragging") {
      if (mobileFocusedId !== null) {
        setGesturePhase("locked");
      } else {
        setGesturePhase("idle");
      }

      guardGhostClickFromLongPress();
      pointerDownWorkIdRef.current = null;
      pointerStartRef.current.pointerId = null;
      return;
    }

    if (isMobileFocusLocked) {
      pointerStartRef.current.pointerId = null;
      return;
    }

    if (
      gesturePhase === "pressing" &&
      pointerDownWorkIdRef.current !== null &&
      !didLongPressRef.current &&
      duration < LONG_PRESS_MS &&
      moved < MOVE_CANCEL_THRESHOLD
    ) {
      const index = layout.findIndex(
        (bubble) => bubble.id === pointerDownWorkIdRef.current,
      );

      if (index >= 0) {
        openWorkModal(layout[index]);
      }
    }

    setGesturePhase("idle");
    pointerDownWorkIdRef.current = null;
    pointerStartRef.current.pointerId = null;
  };

  const handleCanvasPointerCancel = (event: React.PointerEvent<HTMLElement>) => {
    if (pointerStartRef.current.pointerId !== event.pointerId) {
      return;
    }

    clearLongPressTimer();

    if (gesturePhase === "dragging" && mobileFocusedId !== null) {
      setGesturePhase("locked");
      guardGhostClickFromLongPress();
    } else if (!isMobileFocusLocked) {
      clearMobileFocus();
    }

    pointerDownWorkIdRef.current = null;
    pointerStartRef.current.pointerId = null;
  };

  const handleLockedBubbleOpen = useCallback(() => {
    if (didLongPressRef.current) {
      return;
    }

    if (!isMobileFocusLocked || mobileFocusedId === null) {
      return;
    }

    const work = layout.find((bubble) => bubble.id === mobileFocusedId);

    if (work) {
      openWorkModal(work);
    }
  }, [isMobileFocusLocked, layout, mobileFocusedId, openWorkModal]);

  return (
    <>
      <div className="relative mt-9 flex h-[clamp(360px,52svh,460px)] w-full shrink-0 items-stretch justify-center px-0 mb-8 md:hidden">
        <div
          ref={canvasRef}
          className="relative h-full w-full max-w-full overflow-hidden"
          style={{
            touchAction: isDraggingFocus ? "none" : "pan-y",
          }}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerCancel}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: MOONLIGHT_GRADIENT }}
          />

          <BubbleAiMoodLabel className="font-display pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[10px] font-bold tracking-wide text-white/40 backdrop-blur-md" />

          {layout.map((bubble, index) => {
            const isActive = focusedIndex === index;
            const isFeatured = bubble.alwaysVisible;
            const offset = offsets.get(index) ?? { dx: 0, dy: 0 };
            const diameter = isActive
              ? getMobileFocusDiameter(bubble)
              : bubble.baseSize;

            const rawX = isActive
              ? focusCenter.x + offset.dx
              : bubble.x + offset.dx;
            const rawY = isActive
              ? focusCenter.y + offset.dy
              : bubble.y + offset.dy;
            const clamped = clampMobileBubbleCenter(
              rawX,
              rawY,
              diameter / 2,
              bubbleBounds,
              isActive,
            );

            const visualState = getBubbleVisualState(
              isFeatured,
              isFocusActive,
              isActive,
              false,
            );
            const bubbleBackground = getBubbleBackground(bubble.color);
            const bubbleBorder = getBubbleBorder(visualState);
            const bubbleGlow = getBubbleGlow(bubble.color, visualState);
            const driftDuration = getMobileDriftDuration(bubble.id);
            const drift = getBubbleDrift(bubble.id);

            let opacity = isFeatured ? 0.76 : 0.36;

            if (isActive && !isMobileFocusLocked) {
              opacity = 1;
            } else if (isFocusActive) {
              opacity = isFeatured ? 0.45 : 0.3;
            }

            const left = clamped.x - diameter / 2;
            const top = clamped.y - diameter / 2;

            if (isActive && isMobileFocusLocked) {
              return (
                <LockedFocusedBubble
                  key={bubble.id}
                  bubble={bubble}
                  left={left}
                  top={top}
                  diameter={diameter}
                  bubbleBackground={bubbleBackground}
                  bubbleBorder={bubbleBorder}
                  bubbleGlow={bubbleGlow}
                  containerRef={lockedBubbleRef}
                  onOpenModal={handleLockedBubbleOpen}
                  onDismiss={clearMobileFocus}
                />
              );
            }

            if (isActive && isDraggingFocus) {
              return (
                <IdleBubble
                  key={bubble.id}
                  bubble={bubble}
                  left={left}
                  top={top}
                  diameter={diameter}
                  opacity={1}
                  isFeatured={isFeatured}
                  isFocusActive={isFocusActive}
                  showFocusContent
                  bubbleBackground={bubbleBackground}
                  bubbleBorder={bubbleBorder}
                  bubbleGlow={bubbleGlow}
                  driftDuration={driftDuration}
                  drift={drift}
                />
              );
            }

            return (
              <IdleBubble
                key={bubble.id}
                bubble={bubble}
                left={left}
                top={top}
                diameter={diameter}
                opacity={opacity}
                isFeatured={isFeatured}
                isFocusActive={isFocusActive}
                bubbleBackground={bubbleBackground}
                bubbleBorder={bubbleBorder}
                bubbleGlow={bubbleGlow}
                driftDuration={driftDuration}
                drift={drift}
              />
            );
          })}
        </div>
      </div>

    </>
  );
}
