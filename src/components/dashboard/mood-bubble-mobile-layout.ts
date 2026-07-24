import { type WorkBubble } from "./mood-bubble-data";
import type { BubbleOffset, FocusCluster, PlacedBubble } from "./mood-bubble-layout";

export const MOBILE_PAD_X = 22;
export const MOBILE_PAD_TOP = 36;
export const MOBILE_PAD_BOTTOM = 32;
export const MOBILE_MENU_SAFE = { width: 72, height: 72 };
export const MOBILE_FEATURED_COUNT = 7;
export const MOBILE_MEDIUM_COUNT = 14;
export const MOBILE_SMALL_COUNT = 16;
export const MOBILE_TINY_COUNT = 10;

export type MobileBubbleTier = "featured" | "medium" | "small" | "tiny";

export type MobileBubbleBounds = {
  width: number;
  height: number;
  padX: number;
  padTop: number;
  padBottom: number;
  menuSafeWidth: number;
  menuSafeHeight: number;
  focusTopReserve: number;
};

export function getMobileBubbleBounds(
  width: number,
  height: number,
): MobileBubbleBounds {
  return {
    width,
    height,
    padX: MOBILE_PAD_X,
    padTop: MOBILE_PAD_TOP,
    padBottom: MOBILE_PAD_BOTTOM,
    menuSafeWidth: MOBILE_MENU_SAFE.width,
    menuSafeHeight: MOBILE_MENU_SAFE.height,
    focusTopReserve: MOBILE_PAD_TOP,
  };
}

type MobileNode = {
  work: WorkBubble;
  x: number;
  y: number;
  radius: number;
  tier: MobileBubbleTier;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hashSeed(value: number): number {
  let seed = value * 2654435761;
  seed ^= seed << 13;
  seed ^= seed >> 17;
  seed ^= seed << 5;
  return Math.abs(seed);
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function getMobileBubbleTier(
  work: WorkBubble,
  forceFeatured = false,
): MobileBubbleTier {
  if (forceFeatured || work.alwaysVisible) {
    return "featured";
  }

  const seed = hashSeed(work.id * 41);
  const roll = seed % 100;

  if (roll < 34) {
    return "tiny";
  }

  if (roll < 64) {
    return "small";
  }

  return "medium";
}

export function getMobileBubbleDiameter(
  work: WorkBubble,
  tier: MobileBubbleTier = getMobileBubbleTier(work),
): number {
  const seed = hashSeed(work.id * 53);

  switch (tier) {
    case "featured": {
      let diameter = 84 + (seed % 23);

      if (work.quote.length > 36) {
        diameter += 4;
      }

      return diameter;
    }
    case "medium":
      return 40 + (seed % 19);
    case "small":
      return 24 + (seed % 13);
    case "tiny":
      return 12 + (seed % 9);
  }
}

function collisionGap(a: MobileNode, b: MobileNode): number {
  const featured = a.tier === "featured" || b.tier === "featured";

  if (a.tier === "featured" && b.tier === "featured") {
    return 17;
  }

  if (featured) {
    return 13;
  }

  if (a.tier === "medium" && b.tier === "medium") {
    return 10;
  }

  if (
    (a.tier === "medium" || a.tier === "small") &&
    (b.tier === "medium" || b.tier === "small")
  ) {
    return 8;
  }

  return 6;
}

function minDistance(a: MobileNode, b: MobileNode): number {
  return a.radius + b.radius + collisionGap(a, b);
}

function wouldCollide(
  x: number,
  y: number,
  radius: number,
  tier: MobileBubbleTier,
  nodes: MobileNode[],
): boolean {
  const probe: MobileNode = {
    work: { id: -1 } as WorkBubble,
    x,
    y,
    radius,
    tier,
  };

  for (const node of nodes) {
    if (Math.hypot(x - node.x, y - node.y) < minDistance(probe, node)) {
      return true;
    }
  }

  return false;
}

function pushFromMenuSafeZone(
  x: number,
  y: number,
  radius: number,
  width: number,
): { x: number; y: number } {
  const zoneLeft = width - MOBILE_MENU_SAFE.width;
  const closestX = clamp(x, zoneLeft, width);
  const closestY = clamp(y, 0, MOBILE_MENU_SAFE.height);
  const distance = Math.hypot(x - closestX, y - closestY);

  if (distance >= radius + 6) {
    return { x, y };
  }

  return {
    x: Math.min(x, width - MOBILE_MENU_SAFE.width - radius - 10),
    y: Math.max(y, MOBILE_MENU_SAFE.height + radius + 10),
  };
}

function clampNode(node: MobileNode, bounds: MobileBubbleBounds): void {
  const minX = bounds.padX + node.radius;
  const maxX = bounds.width - bounds.padX - node.radius;
  const minY = bounds.padTop + node.radius;
  const maxY = bounds.height - bounds.padBottom - node.radius;

  node.x = clamp(node.x, minX, maxX);
  node.y = clamp(node.y, minY, maxY);

  const menuSafe = pushFromMenuSafeZone(
    node.x,
    node.y,
    node.radius,
    bounds.width,
  );
  node.x = clamp(menuSafe.x, minX, maxX);
  node.y = clamp(menuSafe.y, minY, maxY);
}

function resolveCollisions(
  nodes: MobileNode[],
  bounds: MobileBubbleBounds,
): void {
  for (let pass = 0; pass < 180; pass += 1) {
    let moved = false;

    for (let left = 0; left < nodes.length; left += 1) {
      for (let right = left + 1; right < nodes.length; right += 1) {
        const a = nodes[left];
        const b = nodes[right];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 0.01;
        const required = minDistance(a, b);

        if (distance < required) {
          const overlap = required - distance;
          const push = overlap / distance / 2;
          const priorityA =
            a.tier === "featured" ? 0.25 : a.tier === "medium" ? 0.65 : 1;
          const priorityB =
            b.tier === "featured" ? 0.25 : b.tier === "medium" ? 0.65 : 1;
          const total = priorityA + priorityB;
          a.x -= (dx * push * priorityA) / total;
          a.y -= (dy * push * priorityA) / total;
          b.x += (dx * push * priorityB) / total;
          b.y += (dy * push * priorityB) / total;
          moved = true;
        }
      }
    }

    for (const node of nodes) {
      clampNode(node, bounds);
    }

    if (!moved) {
      break;
    }
  }
}

function placeFeaturedNodes(
  featured: WorkBubble[],
  bounds: MobileBubbleBounds,
): MobileNode[] {
  const centerX = bounds.width * 0.5;
  const usableTop = bounds.padTop;
  const usableBottom = bounds.height - bounds.padBottom;
  const usableHeight = usableBottom - usableTop;
  const halfWidth = bounds.width * 0.5 - bounds.padX;
  const nodes: MobileNode[] = [];

  const slots = [
    { y: usableTop + usableHeight * 0.2, x: centerX - halfWidth * 0.34 },
    { y: usableTop + usableHeight * 0.16, x: centerX + halfWidth * 0.28 },
    { y: usableTop + usableHeight * 0.46, x: centerX - halfWidth * 0.38 },
    { y: usableTop + usableHeight * 0.5, x: centerX + halfWidth * 0.32 },
    { y: usableTop + usableHeight * 0.74, x: centerX - halfWidth * 0.26 },
    { y: usableTop + usableHeight * 0.78, x: centerX + halfWidth * 0.36 },
    { y: usableTop + usableHeight * 0.58, x: centerX + halfWidth * 0.04 },
  ];

  featured.slice(0, MOBILE_FEATURED_COUNT).forEach((work, index) => {
    const tier = "featured" as const;
    const radius = getMobileBubbleDiameter(work, tier) / 2;
    const seed = hashSeed(work.id * 19);
    const slot = slots[index % slots.length];
    const jitterX = ((seed % 17) - 8) * 1.4;
    const jitterY = (((seed >> 4) % 13) - 6) * 1.2;
    const node: MobileNode = {
      work,
      x: slot.x + jitterX,
      y: slot.y + jitterY,
      radius,
      tier,
    };

    clampNode(node, bounds);
    nodes.push(node);
  });

  return nodes;
}

function placeTierNodes(
  works: WorkBubble[],
  tier: Exclude<MobileBubbleTier, "featured">,
  bounds: MobileBubbleBounds,
  placed: MobileNode[],
): MobileNode[] {
  const centerX = bounds.width * 0.5;
  const centerY =
    bounds.padTop +
    (bounds.height - bounds.padTop - bounds.padBottom) * 0.5;
  const nodes = [...placed];
  const rand = seededRandom(
    hashSeed(bounds.width * 19 + bounds.height * 31 + tier.length * 7),
  );
  const maxReachX = centerX - bounds.padX - 8;
  const maxReachY =
    (bounds.height - bounds.padTop - bounds.padBottom) * 0.5 - 8;
  const spread = Math.min(maxReachX, maxReachY / 0.76);

  for (const work of works) {
    const radius = getMobileBubbleDiameter(work, tier) / 2;
    let placedNode: MobileNode | null = null;
    const ringMin = spread * (tier === "medium" ? 0.18 : tier === "small" ? 0.34 : 0.48);
    const ringMax = spread * (tier === "medium" ? 0.88 : tier === "small" ? 0.96 : 0.98);

    for (let attempt = 0; attempt < 96; attempt += 1) {
      const angle = rand() * Math.PI * 2;
      const dist = ringMin + rand() * (ringMax - ringMin);
      const x = centerX + Math.cos(angle) * dist;
      const y = centerY + Math.sin(angle) * dist * 0.76;

      if (!wouldCollide(x, y, radius, tier, nodes)) {
        placedNode = { work, x, y, radius, tier };
        break;
      }
    }

    if (!placedNode) {
      for (let attempt = 0; attempt < 180; attempt += 1) {
        const angle = attempt * 0.44;
        const dist = ringMin + (attempt / 180) * (ringMax - ringMin);
        const x = centerX + Math.cos(angle) * dist;
        const y = centerY + Math.sin(angle) * dist * 0.76;

        if (!wouldCollide(x, y, radius, tier, nodes)) {
          placedNode = { work, x, y, radius, tier };
          break;
        }
      }
    }

    if (!placedNode) {
      const step = tier === "tiny" ? 11 : tier === "small" ? 14 : 20;

      outer: for (
        let gy = bounds.padTop + radius;
        gy <= bounds.height - bounds.padBottom - radius;
        gy += step
      ) {
        for (
          let gx = bounds.padX + radius;
          gx <= bounds.width - bounds.padX - radius;
          gx += step
        ) {
          const offset = gy % (step * 2) === 0 ? 0 : step * 0.5;
          const x = gx + offset;
          const y = gy;

          if (!wouldCollide(x, y, radius, tier, nodes)) {
            placedNode = { work, x, y, radius, tier };
            break outer;
          }
        }
      }
    }

    if (placedNode) {
      nodes.push(placedNode);
    }
  }

  return nodes;
}

export function packMobileBubbles(
  works: WorkBubble[],
  width: number,
  height: number,
): PlacedBubble[] {
  if (width <= 0 || height <= 0) {
    return [];
  }

  const bounds = getMobileBubbleBounds(width, height);
  const featured = works
    .filter((work) => work.alwaysVisible)
    .slice(0, MOBILE_FEATURED_COUNT)
    .map((work) => ({
      ...work,
      baseSize: getMobileBubbleDiameter(work, "featured"),
    }));

  const extras = works.filter((work) => !work.alwaysVisible);
  const mediumWorks = extras
    .filter((work) => getMobileBubbleTier(work) === "medium")
    .slice(0, MOBILE_MEDIUM_COUNT)
    .map((work) => ({
      ...work,
      baseSize: getMobileBubbleDiameter(work, "medium"),
    }));
  const smallWorks = extras
    .filter((work) => getMobileBubbleTier(work) === "small")
    .slice(0, MOBILE_SMALL_COUNT)
    .map((work) => ({
      ...work,
      baseSize: getMobileBubbleDiameter(work, "small"),
    }));
  const tinyWorks = extras
    .filter((work) => getMobileBubbleTier(work) === "tiny")
    .slice(0, MOBILE_TINY_COUNT)
    .map((work) => ({
      ...work,
      baseSize: getMobileBubbleDiameter(work, "tiny"),
    }));

  let nodes = placeFeaturedNodes(featured, bounds);
  nodes = placeTierNodes(tinyWorks, "tiny", bounds, nodes);
  nodes = placeTierNodes(smallWorks, "small", bounds, nodes);
  nodes = placeTierNodes(mediumWorks, "medium", bounds, nodes);
  resolveCollisions(nodes, bounds);

  return nodes
    .map((node) => ({
      ...node.work,
      x: node.x,
      y: node.y,
      radius: node.radius,
      alwaysVisible: node.tier === "featured",
    }))
    .sort((left, right) => left.id - right.id);
}

export function getMobileFocusCenter(bounds: MobileBubbleBounds): {
  x: number;
  y: number;
} {
  const usableTop = bounds.padTop;
  const usableBottom = bounds.height - bounds.padBottom;

  return {
    x: bounds.width * 0.5,
    y: usableTop + (usableBottom - usableTop) * 0.45,
  };
}

export function clampMobileBubbleCenter(
  x: number,
  y: number,
  radius: number,
  bounds: MobileBubbleBounds,
  focused = false,
): { x: number; y: number } {
  const minX = bounds.padX + radius;
  const maxX = bounds.width - bounds.padX - radius;
  const minY =
    (focused ? bounds.focusTopReserve : bounds.padTop) + radius;
  const maxY = bounds.height - bounds.padBottom - radius;

  let cx = clamp(x, minX, maxX);
  let cy = clamp(y, minY, maxY);

  const menuSafe = pushFromMenuSafeZone(cx, cy, radius, bounds.width);
  cx = clamp(menuSafe.x, minX, maxX);
  cy = clamp(menuSafe.y, minY, maxY);

  return { x: cx, y: cy };
}

export function getMobileFocusDiameter(
  work: Pick<WorkBubble, "quote" | "title">,
): number {
  const quoteLength = work.quote.length;
  let diameter = 188;

  if (quoteLength > 44) {
    diameter = 220;
  } else if (quoteLength > 28) {
    diameter = 202;
  }

  if (work.title.length > 22) {
    diameter += 4;
  }

  return clamp(diameter, 188, 224);
}

export function computeMobileFocusOffsets(
  layout: PlacedBubble[],
  cluster: FocusCluster,
  focusCenter: { x: number; y: number },
  primaryDiameter: number,
): Map<number, BubbleOffset> {
  const offsets = new Map<number, BubbleOffset>();

  if (cluster.primaryIndex === null) {
    return offsets;
  }

  const primaryRadius = primaryDiameter / 2;

  for (let index = 0; index < layout.length; index += 1) {
    if (index === cluster.primaryIndex) {
      offsets.set(index, { dx: 0, dy: 0 });
      continue;
    }

    const bubble = layout[index];
    const dx = bubble.x - focusCenter.x;
    const dy = bubble.y - focusCenter.y;
    const distance = Math.hypot(dx, dy) || 1;
    const bubbleRadius = bubble.baseSize * 0.5;
    const required = primaryRadius + bubbleRadius + 14;

    if (distance >= required) {
      offsets.set(index, { dx: 0, dy: 0 });
      continue;
    }

    const push = (required - distance) * 0.72;
    offsets.set(index, {
      dx: (dx / distance) * push,
      dy: (dy / distance) * push,
    });
  }

  return offsets;
}

export function findBubbleIndexAtPoint(
  layout: PlacedBubble[],
  x: number,
  y: number,
): number | null {
  let match: number | null = null;
  let smallestDiameter = Infinity;

  for (let index = 0; index < layout.length; index += 1) {
    const bubble = layout[index];
    const distance = Math.hypot(x - bubble.x, y - bubble.y);

    if (distance <= bubble.baseSize / 2 && bubble.baseSize < smallestDiameter) {
      match = index;
      smallestDiameter = bubble.baseSize;
    }
  }

  return match;
}

export function getFocusPointFromTouch(
  layout: PlacedBubble[],
  touchX: number,
  touchY: number,
): { x: number; y: number } {
  if (layout.length === 0) {
    return { x: touchX, y: touchY };
  }

  let nearestIndex = 0;
  let nearestDistance = Infinity;

  for (let index = 0; index < layout.length; index += 1) {
    const bubble = layout[index];
    const distance = Math.hypot(touchX - bubble.x, touchY - bubble.y);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }

  return {
    x: layout[nearestIndex].x,
    y: layout[nearestIndex].y,
  };
}
