import { type WorkBubble } from "./mood-bubble-data";
import { getIdleFeaturedDiameter, getReadableDiameter } from "./mood-bubble-text";

export type PlacedBubble = WorkBubble & {
  x: number;
  y: number;
  radius: number;
};

export type FocusCluster = {
  primaryIndex: number | null;
  neighborIndices: number[];
};

export type BubbleOffset = {
  dx: number;
  dy: number;
};

type SimNode = {
  work: WorkBubble;
  x: number;
  y: number;
  radius: number;
  primaryAnchor: number;
  secondaryAnchor: number;
  constellationIndex: number;
};

/** Editorial featured tiers — 2 hero, 3 medium, 3 small */
type FeaturedTier = "hero" | "medium" | "small";

const FEATURED_EDITORIAL: Record<
  number,
  { x: number; y: number; tier: FeaturedTier }
> = {
  2: { x: 0.14, y: 0.13, tier: "hero" },
  3: { x: 0.86, y: 0.12, tier: "hero" },
  5: { x: 0.08, y: 0.4, tier: "medium" },
  7: { x: 0.92, y: 0.38, tier: "medium" },
  1: { x: 0.3, y: 0.27, tier: "medium" },
  4: { x: 0.16, y: 0.62, tier: "small" },
  8: { x: 0.8, y: 0.64, tier: "small" },
};

/** Constellation seeds — broad field coverage with bridging clusters */
const CONSTELLATIONS = [
  { x: 0.1, y: 0.16, density: 1.12 },
  { x: 0.26, y: 0.12, density: 0.72 },
  { x: 0.5, y: 0.11, density: 0.88 },
  { x: 0.74, y: 0.14, density: 1.04 },
  { x: 0.9, y: 0.19, density: 0.92 },
  { x: 0.08, y: 0.4, density: 1.08 },
  { x: 0.3, y: 0.36, density: 0.58 },
  { x: 0.52, y: 0.34, density: 0.42 },
  { x: 0.7, y: 0.4, density: 0.78 },
  { x: 0.92, y: 0.46, density: 0.96 },
  { x: 0.12, y: 0.64, density: 1.06 },
  { x: 0.36, y: 0.7, density: 0.68 },
  { x: 0.54, y: 0.68, density: 0.52 },
  { x: 0.76, y: 0.72, density: 0.82 },
  { x: 0.88, y: 0.62, density: 0.86 },
] as const;

/** Intentional negative-space pockets */
const VOID_ZONES = [
  { x: 0.52, y: 0.48, rx: 0.19, ry: 0.075 },
  { x: 0.52, y: 0.73, rx: 0.13, ry: 0.09 },
  { x: 0.52, y: 0.28, rx: 0.11, ry: 0.06 },
] as const;

const EDGE_PADDING = 12;
const SIM_ITERATIONS = 280;
const BALANCE_COLLISION_PASSES = 52;
const MIN_NEIGHBOR_DIAMETER = 88;
const CONTENT_FRACTION = 0.79;
const FIELD_WIDTH_FRACTION = 0.91;
const FIELD_HEIGHT_FRACTION = 0.86;

function getFieldPadding(width: number, height: number): {
  padX: number;
  padY: number;
  fieldWidth: number;
  fieldHeight: number;
  offsetX: number;
  offsetY: number;
} {
  const padX = clamp(Math.round(width * 0.05), 48, 72);
  const padY = clamp(Math.round(height * 0.045), 34, 56);
  const fieldWidth = Math.min(width - padX * 2, width * FIELD_WIDTH_FRACTION);
  const fieldHeight = Math.min(height - padY * 2, height * FIELD_HEIGHT_FRACTION);

  return {
    padX,
    padY,
    fieldWidth,
    fieldHeight,
    offsetX: (width - fieldWidth) / 2,
    offsetY: (height - fieldHeight) / 2,
  };
}

function featuredTierSpread(tier: FeaturedTier): { x: number; y: number } {
  switch (tier) {
    case "hero":
      return { x: 0.058, y: 0.044 };
    case "medium":
      return { x: 0.072, y: 0.054 };
    case "small":
      return { x: 0.082, y: 0.062 };
  }
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

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

function assignConstellation(work: WorkBubble): number {
  const seed = hashSeed(work.id * 29);

  if (work.baseSize <= 24) {
    return seed % CONSTELLATIONS.length;
  }

  if (work.baseSize <= 42) {
    return (seed + 3) % CONSTELLATIONS.length;
  }

  return (seed + 7) % CONSTELLATIONS.length;
}

function sFlowTargetX(y: number, height: number, width: number): number {
  const t = clamp(y / height, 0.04, 0.96);
  const wave =
    Math.sin(t * Math.PI * 1.08) * 0.26 +
    Math.sin(t * Math.PI * 2.05 + 0.6) * 0.07;
  const drift = 0.24 + t * 0.1 + wave;

  return drift * width;
}

function repelFromVoids(
  x: number,
  y: number,
  radius: number,
  width: number,
  height: number,
): { fx: number; fy: number } {
  let fx = 0;
  let fy = 0;

  for (const voidZone of VOID_ZONES) {
    const cx = voidZone.x * width;
    const cy = voidZone.y * height;
    const rx = voidZone.rx * width + radius;
    const ry = voidZone.ry * height + radius;
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    const dist = Math.hypot(dx, dy);

    if (dist >= 1) {
      continue;
    }

    const push = (1 - dist) * 1.8;
    fx += (dx / (dist || 0.01)) * push * 14;
    fy += (dy / (dist || 0.01)) * push * 14;
  }

  return { fx, fy };
}

function antiRowForce(
  node: SimNode,
  nodes: SimNode[],
  index: number,
): { fx: number; fy: number } {
  let fx = 0;
  let fy = 0;
  const rowThreshold = 14;
  const colThreshold = 14;

  for (let other = 0; other < nodes.length; other += 1) {
    if (other === index) {
      continue;
    }

    const peer = nodes[other];

    if (Math.abs(peer.y - node.y) < rowThreshold) {
      fy += peer.y > node.y ? -0.35 : 0.35;
    }

    if (Math.abs(peer.x - node.x) < colThreshold) {
      fx += peer.x > node.x ? -0.28 : 0.28;
    }
  }

  return { fx, fy };
}

function satelliteForce(
  node: SimNode,
  featuredNodes: SimNode[],
): { fx: number; fy: number } {
  if (node.work.alwaysVisible || node.radius > 22) {
    return { fx: 0, fy: 0 };
  }

  let nearest: SimNode | null = null;
  let nearestDistance = Infinity;

  for (const featured of featuredNodes) {
    const distance = Math.hypot(featured.x - node.x, featured.y - node.y);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = featured;
    }
  }

  if (!nearest || nearestDistance > 220) {
    return { fx: 0, fy: 0 };
  }

  const orbit =
    nearest.radius + node.radius + 22 + (hashSeed(node.work.id) % 18);
  const dx = node.x - nearest.x;
  const dy = node.y - nearest.y;
  const distance = Math.hypot(dx, dy) || 1;
  const delta = distance - orbit;

  if (Math.abs(delta) < 6) {
    return { fx: 0, fy: 0 };
  }

  const strength = clamp(Math.abs(delta) * 0.018, 0.08, 0.55);
  const direction = delta > 0 ? 1 : -1;

  return {
    fx: (dx / distance) * strength * direction * -1,
    fy: (dy / distance) * strength * direction * -1,
  };
}

function assignAnchors(work: WorkBubble): {
  primaryAnchor: number;
  secondaryAnchor: number;
} {
  const constellationIndex = assignConstellation(work);
  let secondaryAnchor = (constellationIndex + 4) % CONSTELLATIONS.length;

  if (secondaryAnchor === constellationIndex) {
    secondaryAnchor = (secondaryAnchor + 1) % CONSTELLATIONS.length;
  }

  return { primaryAnchor: constellationIndex, secondaryAnchor };
}

function getAnchorPullStrength(
  anchor: { x: number; y: number; density?: number },
  isPrimary: boolean,
  density = 1,
): number {
  const base = (isPrimary ? 0.0095 : 0.0035) * density;

  if (anchor.y >= 0.58) {
    return base * 0.55;
  }

  if (anchor.y <= 0.24) {
    return base * 1.12;
  }

  return base;
}

function getTopPadding(work: WorkBubble): number {
  const jitter = hashSeed(work.id * 53) % 15;

  if (work.baseSize >= 76 || work.alwaysVisible) {
    return 30 + jitter;
  }

  if (work.baseSize <= 24) {
    return 20 + (jitter % 14);
  }

  return 24 + (jitter % 11);
}

function getExclusionHalfSize(width: number, height: number): {
  halfW: number;
  halfH: number;
} {
  return {
    halfW: clamp(width * 0.19, 180, 210),
    halfH: clamp(height * 0.075, 60, 75),
  };
}

function collisionGap(left: SimNode, right: SimNode): number {
  let gap = 5;

  if (left.work.alwaysVisible || right.work.alwaysVisible) {
    gap = 8;
  } else if (left.radius > 32 || right.radius > 32) {
    gap = 6;
  }

  const leftLarge = left.radius > 52;
  const rightLarge = right.radius > 52;

  if (leftLarge && rightLarge) {
    gap += 22;
  } else if (
    (left.work.alwaysVisible && rightLarge) ||
    (right.work.alwaysVisible && leftLarge)
  ) {
    gap += 18;
  }

  return gap;
}

function minNodeDistance(left: SimNode, right: SimNode): number {
  let minDistance = left.radius + right.radius + collisionGap(left, right);

  if (left.work.alwaysVisible && right.work.alwaysVisible) {
    minDistance = Math.max(
      minDistance,
      (left.radius + right.radius) * 1.55,
    );
  }

  return minDistance;
}

function repelFromHeading(
  x: number,
  y: number,
  radius: number,
  centerX: number,
  centerY: number,
  halfW: number,
  halfH: number,
): { fx: number; fy: number } {
  const closestX = clamp(x, centerX - halfW, centerX + halfW);
  const closestY = clamp(y, centerY - halfH, centerY + halfH);
  const dx = x - closestX;
  const dy = y - closestY;
  const distance = Math.hypot(dx, dy);

  if (distance >= radius + 3) {
    return { fx: 0, fy: 0 };
  }

  const overlap = radius + 5 - distance;
  const strength = distance > 0.01 ? overlap / distance : overlap * 10;

  return {
    fx: (dx || 0.01) * strength * 2.4,
    fy: (dy || 0.01) * strength * 2.4,
  };
}

function repelFromEdges(
  x: number,
  y: number,
  radius: number,
  width: number,
  height: number,
  work: WorkBubble,
): { fx: number; fy: number } {
  let fx = 0;
  let fy = 0;
  const edgeInset = work.alwaysVisible ? 0.03 : 0.02;
  const marginX = Math.max(EDGE_PADDING + radius, width * edgeInset + radius);
  const topMargin = getTopPadding(work) + radius;
  const bottomMargin = Math.max(EDGE_PADDING + radius, height * edgeInset + radius);

  if (x < marginX) {
    fx += (marginX - x) * 0.1;
  }

  if (x > width - marginX) {
    fx -= (x - (width - marginX)) * 0.1;
  }

  if (y < topMargin) {
    fy += (topMargin - y) * 0.12;
  }

  if (y > height - bottomMargin) {
    fy -= (y - (height - bottomMargin)) * 0.1;
  }

  return { fx, fy };
}

function anchorSpread(work: WorkBubble): number {
  if (work.alwaysVisible) {
    return 0.13;
  }

  if (work.baseSize >= 62) {
    return 0.15;
  }

  if (work.baseSize >= 40) {
    return 0.17;
  }

  if (work.baseSize >= 24) {
    return 0.19;
  }

  return 0.21;
}

function initializeNodes(
  works: WorkBubble[],
  width: number,
  height: number,
): SimNode[] {
  const sorted = [...works].sort((left, right) => {
    if (left.alwaysVisible !== right.alwaysVisible) {
      return left.alwaysVisible ? -1 : 1;
    }

    return right.baseSize - left.baseSize;
  });

  return sorted.map((work) => {
    const rand = seededRandom(hashSeed(work.id * 31 + width + height));
    const radius = work.alwaysVisible
      ? getIdleFeaturedDiameter(work) / 2
      : work.baseSize / 2;

    let x: number;
    let y: number;
    let primaryAnchor: number;
    let secondaryAnchor: number;

    const editorial = work.alwaysVisible
      ? FEATURED_EDITORIAL[work.id]
      : undefined;

    if (editorial) {
      const spread = featuredTierSpread(editorial.tier);

      x =
        editorial.x * width +
        (rand() - 0.5) * width * spread.x;
      y =
        editorial.y * height +
        (rand() - 0.5) * height * spread.y;

      const anchors = assignAnchors(work);
      primaryAnchor = anchors.primaryAnchor;
      secondaryAnchor = anchors.secondaryAnchor;
    } else {
      const anchors = assignAnchors(work);
      primaryAnchor = anchors.primaryAnchor;
      secondaryAnchor = anchors.secondaryAnchor;
      const primary = CONSTELLATIONS[primaryAnchor];
      const secondary = CONSTELLATIONS[secondaryAnchor];
      const densityBlend = primary.density * 0.65 + secondary.density * 0.35;
      const spreadBase = anchorSpread(work) / Math.max(densityBlend, 0.45);

      const blend = 0.68 + rand() * 0.22;
      const anchorX = primary.x * blend + secondary.x * (1 - blend);
      const anchorY = primary.y * blend + secondary.y * (1 - blend);

      x =
        anchorX * width +
        (rand() - 0.5) * width * spreadBase;
      y =
        anchorY * height +
        (rand() - 0.5) * height * spreadBase;

      if (primary.density < 0.58 && rand() > primary.density * 1.25) {
        const sparse = CONSTELLATIONS[(primaryAnchor + 5) % CONSTELLATIONS.length];
        x = sparse.x * width + (rand() - 0.5) * width * 0.16;
        y = sparse.y * height + (rand() - 0.5) * height * 0.14;
      }

      if (work.baseSize >= 44) {
        const edgeSeed = hashSeed(work.id * 41) % 100;
        const edgePull = 0.06 + (edgeSeed % 8) / 100;

        if (x < width * 0.42) {
          x -= width * edgePull * 0.42;
        } else if (x > width * 0.58) {
          x += width * edgePull * 0.42;
        }

        if (y < height * 0.34) {
          y -= height * edgePull * 0.18;
        } else if (y > height * 0.66) {
          y += height * edgePull * 0.18;
        }
      }
    }

    const inset = work.alwaysVisible ? 0.03 : 0.02;
    const minY = getTopPadding(work) + radius;

    x = clamp(
      x,
      width * inset + radius,
      width * (1 - inset) - radius,
    );
    y = clamp(
      y,
      minY,
      height * (1 - inset) - radius,
    );

    return {
      work,
      x,
      y,
      radius,
      primaryAnchor,
      secondaryAnchor,
      constellationIndex: primaryAnchor,
    };
  });
}

function clampNode(node: SimNode, width: number, height: number): void {
  const inset = node.work.alwaysVisible ? 0.03 : 0.02;
  const minY = getTopPadding(node.work) + node.radius;

  node.x = clamp(
    node.x,
    width * inset + node.radius,
    width * (1 - inset) - node.radius,
  );
  node.y = clamp(
    node.y,
    minY,
    height * (1 - inset) - node.radius,
  );
}

function resolveCollisions(
  nodes: SimNode[],
  width: number,
  height: number,
  passes: number,
): void {
  for (let pass = 0; pass < passes; pass += 1) {
    let moved = false;

    for (let left = 0; left < nodes.length; left += 1) {
      for (let right = left + 1; right < nodes.length; right += 1) {
        const a = nodes[left];
        const b = nodes[right];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 0.01;
        const minDistance = minNodeDistance(a, b);

        if (distance < minDistance) {
          const overlap = minDistance - distance;
          const push = overlap / distance / 2;
          a.x -= dx * push;
          a.y -= dy * push;
          b.x += dx * push;
          b.y += dy * push;
          moved = true;
        }
      }
    }

    for (const node of nodes) {
      clampNode(node, width, height);
    }

    if (!moved) {
      break;
    }
  }
}

function zoneOccupiedArea(
  nodes: SimNode[],
  height: number,
  width: number,
): {
  upper: number;
  middle: number;
  lower: number;
  left: number;
  right: number;
} {
  const third = height / 3;
  const zones = { upper: 0, middle: 0, lower: 0, left: 0, right: 0 };

  for (const node of nodes) {
    const area = Math.PI * node.radius * node.radius;

    if (node.y < third) {
      zones.upper += area;
    } else if (node.y < third * 2) {
      zones.middle += area;
    } else {
      zones.lower += area;
    }

    if (node.x < width / 2) {
      zones.left += area;
    } else {
      zones.right += area;
    }
  }

  return zones;
}

function nodeMovePriority(node: SimNode): number {
  if (node.work.alwaysVisible) {
    return 3;
  }

  if (node.radius > 30) {
    return 2;
  }

  return 1;
}

function runBalancingPass(
  nodes: SimNode[],
  width: number,
  height: number,
): void {
  const third = height / 3;
  const centerX = width / 2;
  const { halfW, halfH } = getExclusionHalfSize(width, height);
  const headingCenterY = height / 2;

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const zones = zoneOccupiedArea(nodes, height, width);
    const verticalTotal = zones.upper + zones.middle + zones.lower;

    if (verticalTotal <= 0) {
      break;
    }

    const lowerShare = zones.lower / verticalTotal;
    const upperShare = zones.upper / verticalTotal;

    if (lowerShare > 0.3 || zones.lower > zones.upper * 1.18) {
      const candidates = nodes
        .filter((node) => node.y > third * 1.55)
        .sort((left, right) => right.y - left.y || nodeMovePriority(left) - nodeMovePriority(right));

      for (const node of candidates.slice(0, 12)) {
        const shift = clamp((zones.lower - zones.upper * 1.05) * 0.00008, 4, 18);
        node.y -= shift * (nodeMovePriority(node) === 1 ? 1.15 : 0.72);
        clampNode(node, width, height);
      }
    }

    if (upperShare < 0.28) {
      const candidates = nodes
        .filter((node) => !node.work.alwaysVisible && node.y > third && node.radius <= 22)
        .sort((left, right) => left.y - right.y);

      for (const node of candidates.slice(0, 14)) {
        node.y -= clamp(third * 0.06, 8, 22);
        clampNode(node, width, height);
      }
    }

    const horizontalTotal = zones.left + zones.right;

    if (horizontalTotal > 0) {
      const leftShare = zones.left / horizontalTotal;

      if (leftShare > 0.58) {
        for (const node of nodes.filter((entry) => entry.x < centerX && !entry.work.alwaysVisible).slice(0, 10)) {
          node.x += 10;
          clampNode(node, width, height);
        }
      } else if (leftShare < 0.42) {
        for (const node of nodes.filter((entry) => entry.x >= centerX && !entry.work.alwaysVisible).slice(0, 10)) {
          node.x -= 10;
          clampNode(node, width, height);
        }
      }
    }

    resolveCollisions(nodes, width, height, 8);

    for (const node of nodes) {
      const headingRepulsion = repelFromHeading(
        node.x,
        node.y,
        node.radius,
        centerX,
        headingCenterY,
        halfW,
        halfH,
      );

      node.x += headingRepulsion.fx * 0.08;
      node.y += headingRepulsion.fy * 0.08;
      clampNode(node, width, height);
    }
  }

  resolveCollisions(nodes, width, height, BALANCE_COLLISION_PASSES);
}

function runForceSimulation(
  nodes: SimNode[],
  width: number,
  height: number,
): void {
  const centerX = width / 2;
  const balanceCenterY = height * 0.44;
  const { halfW, halfH } = getExclusionHalfSize(width, height);
  const featuredNodes = nodes.filter((node) => node.work.alwaysVisible);

  for (let iteration = 0; iteration < SIM_ITERATIONS; iteration += 1) {
    const forces = nodes.map(() => ({ fx: 0, fy: 0 }));
    const damping = iteration > SIM_ITERATIONS * 0.7 ? 0.72 : 0.88;

    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      const primary = CONSTELLATIONS[node.primaryAnchor];
      const secondary = CONSTELLATIONS[node.secondaryAnchor];

      if (node.work.alwaysVisible) {
        const editorial = FEATURED_EDITORIAL[node.work.id];

        if (editorial) {
          forces[index].fx += (editorial.x * width - node.x) * 0.014;
          forces[index].fy += (editorial.y * height - node.y) * 0.014;
        }
      } else {
        forces[index].fx +=
          (primary.x * width - node.x) *
          getAnchorPullStrength(primary, true, primary.density);
        forces[index].fy +=
          (primary.y * height - node.y) *
          getAnchorPullStrength(primary, true, primary.density);
        forces[index].fx +=
          (secondary.x * width - node.x) *
          getAnchorPullStrength(secondary, false, secondary.density);
        forces[index].fy +=
          (secondary.y * height - node.y) *
          getAnchorPullStrength(secondary, false, secondary.density);
      }

      const flowX = sFlowTargetX(node.y, height, width);
      forces[index].fx += (flowX - node.x) * 0.0018;
      forces[index].fx += (centerX - node.x) * 0.0016;
      forces[index].fy += (balanceCenterY - node.y) * 0.0022;

      const headingRepulsion = repelFromHeading(
        node.x,
        node.y,
        node.radius,
        centerX,
        height / 2,
        halfW,
        halfH,
      );
      forces[index].fx += headingRepulsion.fx;
      forces[index].fy += headingRepulsion.fy;

      const voidRepulsion = repelFromVoids(
        node.x,
        node.y,
        node.radius,
        width,
        height,
      );
      forces[index].fx += voidRepulsion.fx;
      forces[index].fy += voidRepulsion.fy;

      const edgeRepulsion = repelFromEdges(
        node.x,
        node.y,
        node.radius,
        width,
        height,
        node.work,
      );
      forces[index].fx += edgeRepulsion.fx;
      forces[index].fy += edgeRepulsion.fy;

      const rowBreak = antiRowForce(node, nodes, index);
      forces[index].fx += rowBreak.fx;
      forces[index].fy += rowBreak.fy;

      const satellite = satelliteForce(node, featuredNodes);
      forces[index].fx += satellite.fx;
      forces[index].fy += satellite.fy;
    }

    for (let left = 0; left < nodes.length; left += 1) {
      for (let right = left + 1; right < nodes.length; right += 1) {
        const a = nodes[left];
        const b = nodes[right];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 0.01;
        const minDistance = minNodeDistance(a, b);

        if (distance < minDistance) {
          const overlap = minDistance - distance;
          const push = (overlap / distance) * 0.58;
          forces[left].fx -= dx * push;
          forces[left].fy -= dy * push;
          forces[right].fx += dx * push;
          forces[right].fy += dy * push;
        }
      }
    }

    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      node.x += forces[index].fx * damping;
      node.y += forces[index].fy * damping;
      clampNode(node, width, height);
    }
  }
}

export function packWorkBubbles(
  works: WorkBubble[],
  width: number,
  height: number,
): PlacedBubble[] {
  if (width <= 0 || height <= 0 || works.length === 0) {
    return [];
  }

  const field = getFieldPadding(width, height);
  const nodes = initializeNodes(works, field.fieldWidth, field.fieldHeight);
  runForceSimulation(nodes, field.fieldWidth, field.fieldHeight);
  runBalancingPass(nodes, field.fieldWidth, field.fieldHeight);
  resolveCollisions(nodes, field.fieldWidth, field.fieldHeight, 36);

  return nodes
    .map((node) => ({
      ...node.work,
      x: node.x + field.offsetX,
      y: node.y + field.offsetY,
      radius: node.radius,
    }))
    .sort((left, right) => left.id - right.id);
}

/** Desktop home: reserved top padding for floating navigation (px). */
export const DESKTOP_BUBBLE_CANVAS_TOP = 100;
/** Global downward shift applied after pack — does not re-simulate positions. */
export const DESKTOP_BUBBLE_FIELD_OFFSET_Y = 88;
/** Min bubble-center Y in content coords — keeps large bubbles below nav on hover. */
export const DESKTOP_BUBBLE_NAV_SAFE_Y = 72;
/** Slight featured bubble boost (+12%) without changing layout algorithm. */
export const DESKTOP_FEATURED_SIZE_SCALE = 1.12;

export function applyDesktopBubbleFieldOffset(
  layout: PlacedBubble[],
  offsetY = DESKTOP_BUBBLE_FIELD_OFFSET_Y,
): PlacedBubble[] {
  if (offsetY === 0) {
    return layout;
  }

  return layout.map((bubble) => ({
    ...bubble,
    y: bubble.y + offsetY,
  }));
}

/** Deterministic idle drift parameters per bubble */
export function getBubbleDrift(bubbleId: number): {
  amplitude: number;
  duration: number;
  phaseX: number;
  phaseY: number;
} {
  const seed = hashSeed(bubbleId * 97);

  return {
    amplitude: 2 + (seed % 3),
    duration: 8 + (seed % 7),
    phaseX: ((seed >> 4) % 1000) / 1000,
    phaseY: ((seed >> 12) % 1000) / 1000,
  };
}

export function getMinimumFocusDiameter(bubble: PlacedBubble): number {
  return getReadableDiameter(bubble, "focused");
}

function getPrimaryFocusScale(bubble: PlacedBubble): number {
  return getMinimumFocusDiameter(bubble) / bubble.baseSize;
}

function getNeighborFocusScale(bubble: PlacedBubble): number {
  const targetDiameter = Math.max(
    bubble.baseSize * 1.2,
    MIN_NEIGHBOR_DIAMETER,
  );

  return clamp(targetDiameter / bubble.baseSize, 1.06, 2.8);
}

function getFarFocusScale(bubble: PlacedBubble): number {
  if (bubble.alwaysVisible) {
    return clamp(118 / bubble.baseSize, 0.88, 0.96);
  }

  return bubble.baseSize <= 26 ? 0.93 : 0.96;
}

export function getBubbleScale(
  bubble: PlacedBubble,
  cluster: FocusCluster,
  index: number,
  pointerInside: boolean,
): number {
  if (!pointerInside) {
    return 1;
  }

  const isPrimary = cluster.primaryIndex === index;
  const isNeighbor = cluster.neighborIndices.includes(index);

  if (isPrimary) {
    return getPrimaryFocusScale(bubble);
  }

  if (isNeighbor) {
    return getNeighborFocusScale(bubble);
  }

  return getFarFocusScale(bubble);
}

export function getVisualDiameter(
  bubble: PlacedBubble,
  scale: number,
): number {
  return bubble.baseSize * scale;
}

export function getBubbleOpacity(
  bubble: PlacedBubble,
  cluster: FocusCluster,
  index: number,
  pointerInside: boolean,
): number {
  if (!pointerInside) {
    return getIdleOpacity(bubble.baseSize, bubble.alwaysVisible);
  }

  const isPrimary = cluster.primaryIndex === index;
  const isNeighbor = cluster.neighborIndices.includes(index);

  if (isPrimary) {
    return 1;
  }

  if (isNeighbor) {
    return 0.9;
  }

  if (bubble.alwaysVisible) {
    return 0.65;
  }

  return getBlindIdleOpacity(bubble.baseSize);
}

function getBlindIdleOpacity(baseSize: number): number {
  if (baseSize <= 22) {
    return 0.18 + (baseSize - 12) * 0.003;
  }

  if (baseSize <= 38) {
    return 0.2 + (baseSize - 24) * 0.003;
  }

  return clamp(0.22 + (baseSize - 40) * 0.0015, 0.22, 0.25);
}

export function getIdleOpacity(
  baseSize: number,
  alwaysVisible: boolean,
): number {
  if (alwaysVisible) {
    return 0.65;
  }

  return getBlindIdleOpacity(baseSize);
}

export function findFocusCluster(
  layout: PlacedBubble[],
  pointerX: number,
  pointerY: number,
): FocusCluster {
  if (layout.length === 0) {
    return { primaryIndex: null, neighborIndices: [] };
  }

  const ranked = layout
    .map((bubble, index) => ({
      index,
      distance: Math.hypot(pointerX - bubble.x, pointerY - bubble.y),
    }))
    .sort((left, right) => left.distance - right.distance);

  return {
    primaryIndex: ranked[0]?.index ?? null,
    neighborIndices: ranked.slice(1, 5).map((entry) => entry.index),
  };
}

function expandedRadius(bubble: PlacedBubble, scale: number): number {
  return bubble.radius * scale;
}

function getPosition(
  layout: PlacedBubble[],
  index: number,
  offsets: Map<number, BubbleOffset>,
): { x: number; y: number } {
  const bubble = layout[index];
  const offset = offsets.get(index) ?? { dx: 0, dy: 0 };

  return {
    x: bubble.x + offset.dx,
    y: bubble.y + offset.dy,
  };
}

function bubbleIntersectsGroup(
  layout: PlacedBubble[],
  index: number,
  clusterIndices: number[],
  cluster: FocusCluster,
  offsets: Map<number, BubbleOffset>,
  primaryIndex: number,
  primaryScale: number,
): boolean {
  if (clusterIndices.includes(index)) {
    return false;
  }

  const bubble = layout[index];
  const bubbleScale = getBubbleScale(bubble, cluster, index, true);
  const bubblePos = getPosition(layout, index, offsets);
  const bubbleRadius = expandedRadius(bubble, bubbleScale);
  const primaryPos = getPosition(layout, primaryIndex, offsets);
  const primary = layout[primaryIndex];
  const primaryRadius = expandedRadius(primary, primaryScale);

  const distanceToPrimary = Math.hypot(
    bubblePos.x - primaryPos.x,
    bubblePos.y - primaryPos.y,
  );

  if (distanceToPrimary < primaryRadius + bubbleRadius + 6) {
    return true;
  }

  for (const neighborIndex of cluster.neighborIndices) {
    const neighbor = layout[neighborIndex];
    const neighborScale = getBubbleScale(neighbor, cluster, neighborIndex, true);
    const neighborPos = getPosition(layout, neighborIndex, offsets);
    const neighborRadius = expandedRadius(neighbor, neighborScale);
    const distanceToNeighbor = Math.hypot(
      bubblePos.x - neighborPos.x,
      bubblePos.y - neighborPos.y,
    );

    if (distanceToNeighbor < neighborRadius + bubbleRadius + 4) {
      return true;
    }
  }

  return false;
}

export function computeFocusOffsets(
  layout: PlacedBubble[],
  cluster: FocusCluster,
  pointerInside: boolean,
): Map<number, BubbleOffset> {
  const offsets = new Map<number, BubbleOffset>();

  if (cluster.primaryIndex === null || !pointerInside) {
    return offsets;
  }

  const primaryIndex = cluster.primaryIndex;
  const primary = layout[primaryIndex];
  const primaryScale = getBubbleScale(primary, cluster, primaryIndex, true);
  const clusterIndices = [primaryIndex, ...cluster.neighborIndices];

  for (const index of clusterIndices) {
    offsets.set(index, { dx: 0, dy: 0 });
  }

  const intersectingIndices = layout
    .map((_, index) => index)
    .filter((index) =>
      bubbleIntersectsGroup(
        layout,
        index,
        clusterIndices,
        cluster,
        offsets,
        primaryIndex,
        primaryScale,
      ),
    );

  for (const index of intersectingIndices) {
    offsets.set(index, { dx: 0, dy: 0 });
  }

  const movableIndices = [...clusterIndices, ...intersectingIndices];

  for (let pass = 0; pass < 4; pass += 1) {
    for (const neighborIndex of cluster.neighborIndices) {
      const neighbor = layout[neighborIndex];
      const neighborScale = getBubbleScale(
        neighbor,
        cluster,
        neighborIndex,
        true,
      );
      const primaryPos = getPosition(layout, primaryIndex, offsets);
      const neighborOffset = offsets.get(neighborIndex) ?? { dx: 0, dy: 0 };
      const neighborX = neighbor.x + neighborOffset.dx;
      const neighborY = neighbor.y + neighborOffset.dy;

      const dx = neighborX - primaryPos.x;
      const dy = neighborY - primaryPos.y;
      const distance = Math.hypot(dx, dy) || 1;
      const minDistance =
        expandedRadius(primary, primaryScale) +
        expandedRadius(neighbor, neighborScale) +
        10;

      if (distance < minDistance) {
        const push = (minDistance - distance) * 0.68;
        neighborOffset.dx += (dx / distance) * push;
        neighborOffset.dy += (dy / distance) * push;
        offsets.set(neighborIndex, neighborOffset);
      }
    }

    for (let left = 0; left < cluster.neighborIndices.length; left += 1) {
      for (let right = left + 1; right < cluster.neighborIndices.length; right += 1) {
        const leftIndex = cluster.neighborIndices[left];
        const rightIndex = cluster.neighborIndices[right];
        const leftBubble = layout[leftIndex];
        const rightBubble = layout[rightIndex];
        const leftOffset = offsets.get(leftIndex) ?? { dx: 0, dy: 0 };
        const rightOffset = offsets.get(rightIndex) ?? { dx: 0, dy: 0 };

        const leftX = leftBubble.x + leftOffset.dx;
        const leftY = leftBubble.y + leftOffset.dy;
        const rightX = rightBubble.x + rightOffset.dx;
        const rightY = rightBubble.y + rightOffset.dy;

        const dx = rightX - leftX;
        const dy = rightY - leftY;
        const distance = Math.hypot(dx, dy) || 1;
        const minDistance =
          expandedRadius(
            leftBubble,
            getBubbleScale(leftBubble, cluster, leftIndex, true),
          ) +
          expandedRadius(
            rightBubble,
            getBubbleScale(rightBubble, cluster, rightIndex, true),
          ) +
          8;

        if (distance < minDistance) {
          const push = (minDistance - distance) * 0.45;
          leftOffset.dx -= (dx / distance) * push;
          leftOffset.dy -= (dy / distance) * push;
          rightOffset.dx += (dx / distance) * push;
          rightOffset.dy += (dy / distance) * push;
          offsets.set(leftIndex, leftOffset);
          offsets.set(rightIndex, rightOffset);
        }
      }
    }

    for (const index of intersectingIndices) {
      const bubble = layout[index];
      const bubbleScale = getBubbleScale(bubble, cluster, index, true);
      const current = offsets.get(index) ?? { dx: 0, dy: 0 };
      const bubbleX = bubble.x + current.dx;
      const bubbleY = bubble.y + current.dy;
      const bubbleRadius = expandedRadius(bubble, bubbleScale);
      const primaryPos = getPosition(layout, primaryIndex, offsets);

      const dx = bubbleX - primaryPos.x;
      const dy = bubbleY - primaryPos.y;
      const distance = Math.hypot(dx, dy) || 1;
      const minDistance =
        expandedRadius(primary, primaryScale) + bubbleRadius + 8;

      if (distance < minDistance) {
        const push = (minDistance - distance) * 0.58;
        current.dx += (dx / distance) * push;
        current.dy += (dy / distance) * push;
        offsets.set(index, current);
      }
    }

    for (let left = 0; left < movableIndices.length; left += 1) {
      for (let right = left + 1; right < movableIndices.length; right += 1) {
        const leftIndex = movableIndices[left];
        const rightIndex = movableIndices[right];
        const leftBubble = layout[leftIndex];
        const rightBubble = layout[rightIndex];
        const leftOffset = offsets.get(leftIndex) ?? { dx: 0, dy: 0 };
        const rightOffset = offsets.get(rightIndex) ?? { dx: 0, dy: 0 };

        const leftX = leftBubble.x + leftOffset.dx;
        const leftY = leftBubble.y + leftOffset.dy;
        const rightX = rightBubble.x + rightOffset.dx;
        const rightY = rightBubble.y + rightOffset.dy;

        const dx = rightX - leftX;
        const dy = rightY - leftY;
        const distance = Math.hypot(dx, dy) || 1;
        const minDistance =
          expandedRadius(
            leftBubble,
            getBubbleScale(leftBubble, cluster, leftIndex, true),
          ) +
          expandedRadius(
            rightBubble,
            getBubbleScale(rightBubble, cluster, rightIndex, true),
          ) +
          6;

        if (distance < minDistance) {
          const push = (minDistance - distance) * 0.38;
          leftOffset.dx -= (dx / distance) * push;
          leftOffset.dy -= (dy / distance) * push;
          rightOffset.dx += (dx / distance) * push;
          rightOffset.dy += (dy / distance) * push;
          offsets.set(leftIndex, leftOffset);
          offsets.set(rightIndex, rightOffset);
        }
      }
    }
  }

  return offsets;
}

export function getAlwaysVisibleFontSizes(baseSize: number): {
  type: number;
  quote: number;
  title: number;
} {
  if (baseSize >= 148) {
    return { type: 8, quote: 13, title: 11 };
  }

  if (baseSize >= 128) {
    return { type: 8, quote: 12, title: 10 };
  }

  return { type: 8, quote: 11, title: 9 };
}

export function getFocusedFontSizes(expandedDiameter: number): {
  type: number;
  quote: number;
  title: number;
} {
  if (expandedDiameter >= 220) {
    return { type: 10, quote: 15, title: 12 };
  }

  if (expandedDiameter >= 200) {
    return { type: 10, quote: 14, title: 12 };
  }

  if (expandedDiameter >= 196) {
    return { type: 9, quote: 14, title: 11 };
  }

  return { type: 9, quote: 13, title: 11 };
}

export function getContentWidth(baseSize: number): number {
  return baseSize * CONTENT_FRACTION;
}

export function getContentMaxHeight(baseSize: number): number {
  return baseSize * CONTENT_FRACTION;
}
