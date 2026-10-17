import { mulberry32 } from "../../utils";
import { STALL } from "../config";
import type { CityLayout } from "../generate";
import { STALL_SIGNS } from "../signage";
import type { SmokeSource } from "./Smoke";
import type { SheetCell, StallSheet } from "./stall-art";
import { GLOW_CELL, LANTERN_CELL, SIGN_GLOW_PAD, signBoard } from "./stall-art";
import type { Rgb, StallPlan } from "./stall-plan";
import { glowColor, INK, lerp } from "./stall-plan";

const SEED = 2028;

/** Lantern light: the paper's colour, centred on the paper (this far below the cell's top). */
const LANTERN_LIGHT: Rgb = [255, 110, 70];
const LANTERN_LIGHT_Y = 11;

export type StallParts = {
  boxes: { color: Float32Array; count: number; offset: Float32Array; params: Float32Array; size: Float32Array };
  bulbs: { count: number; position: Float32Array; radii: Float32Array };
  details: { count: number; flat: Float32Array; offset: Float32Array; size: Float32Array; uv: Float32Array };
  /** Volumetric glow spheres: center, radius and colour per stall. */
  glows: { center: Float32Array; color: Float32Array; count: number; radius: Float32Array };
  smokeSources: SmokeSource[];
};

/** One stall on the street: a variant at an x, with its own word when the variant's roof carries a header. */
export type Placement = { left: number; plan: StallPlan; variant: number; word: null | string };

/**
 * Clusters of stalls along the nearest layer, `STALL.clusterGap` apart; each picks a variant. Words are rolled
 * per placement (from their own stream, so they don't move the stalls) rather than per variant, so the same
 * stall shows different words along the street.
 */
export const placeStalls = (layout: CityLayout, plans: StallPlan[]): Placement[] => {
  const layer = layout.layers[layout.layers.length - 1];
  const placements: Placement[] = [];

  if (!layer || !plans.length) {
    return placements;
  }

  const rand = mulberry32(SEED);
  const words = mulberry32(SEED + 1);
  const half = layer.span / 2;
  let x = -half - 60 * rand();

  while (x < half) {
    const clusterSize = STALL.cluster.min + Math.floor((STALL.cluster.extra + 1) * rand());
    for (let k = 0; k < clusterSize && x < half; k++) {
      const variant = Math.floor(rand() * plans.length);
      const plan = plans[variant];
      if (!plan) break;
      const word =
        plan.awning.kind === "solid" ? (STALL_SIGNS[Math.floor(words() * STALL_SIGNS.length)] ?? null) : null;
      placements.push({ left: x, plan, variant, word });
      x += (plan.width + 8 + 10 * rand()) * STALL.scale;
    }
    x += STALL.clusterGap.min + STALL.clusterGap.extra * rand();
  }

  return placements;
};

/** Accumulates one stall's parts in stall-local reference px (x from the left edge, y up, z from the back). */
class StallBuilder {
  readonly boxColors: number[] = [];
  boxCount = 0;
  readonly boxes: number[] = [];
  readonly boxParams: number[] = [];
  bulbCount = 0;
  readonly bulbRadii: number[] = [];
  readonly bulbs: number[] = [];
  detailCount = 0;
  readonly detailFlat: number[] = [];
  readonly details: number[] = [];
  readonly detailUv: number[] = [];
  readonly glowCenters: number[] = [];
  readonly glowColors: number[] = [];
  glowCount = 0;
  readonly glowRadii: number[] = [];
  readonly smokeSources: SmokeSource[] = [];

  constructor(
    readonly groundY: number,
    readonly backZ: number,
  ) {}

  /** Box from its min corner; `rise` lifts the back edge (a sloped roof), `emissive` skips the shading. */
  box(
    left: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: Rgb,
    opts: { emissive?: boolean; rise?: number; stripes?: number; topOnly?: boolean } = {},
  ) {
    const k = STALL.scale;
    this.boxes.push(left + x * k, this.groundY + y * k, this.backZ + z * k, w * k, h * k, d * k);
    this.boxColors.push(color[0] / 255, color[1] / 255, color[2] / 255);
    this.boxParams.push(opts.stripes ?? 0, (opts.rise ?? 0) * k, opts.emissive ? 1 : 0, opts.topOnly ? 1 : 0);
    this.boxCount++;
  }

  bulb(left: number, x: number, y: number, z: number) {
    const k = STALL.scale;
    this.bulbs.push(left + x * k, this.groundY + y * k, this.backZ + z * k);
    this.bulbRadii.push(1 * k, 5 * k);
    this.bulbCount++;
  }

  /** Soft ball of warm haze around the stall. */
  glow(left: number, x: number, y: number, z: number, radius: number, color: Rgb, strength = 1) {
    const k = STALL.scale;
    this.glowCenters.push(left + x * k, this.groundY + y * k, this.backZ + z * k);
    this.glowRadii.push(radius * k);
    this.glowColors.push((strength * color[0]) / 255, (strength * color[1]) / 255, (strength * color[2]) / 255);
    this.glowCount++;
  }

  /** Sprite quad from its bottom-left; vertical (facing the camera) or flat on the ground extending back. */
  sprite(left: number, x: number, y: number, z: number, w: number, h: number, cell: SheetCell, flat = false) {
    const k = STALL.scale;
    this.details.push(left + x * k, this.groundY + y * k, this.backZ + z * k, w * k, h * k);
    this.detailFlat.push(flat ? 1 : 0);
    this.detailUv.push(...cell.uv);
    this.detailCount++;
  }
}

const addStall = (b: StallBuilder, placement: Placement, index: number, sheet: StallSheet) => {
  const { left, plan, variant } = placement;
  const { awning, bodyHeight: l, counterHeight: r, depth: d, width: t } = plan;
  const warm = glowColor(plan);

  // the roof is a slab from z = -3 to d + 4 whose back edge is lifted by the awning's rise; everything
  // standing under it reaches its underside at that z so nothing floats
  const roofBack = -3;
  const roofDepth = d + 7;
  const roofAt = (z: number) => l + awning.rise * (1 - (z - roofBack) / roofDepth);

  // structure: the kitchen block at the back, four posts, the counter. The block takes everything behind a
  // fixed serving gap in front of the counter, so it can never reach the counter and there is always room
  // for someone serving
  const wallDepth = Math.max(4, d - STALL.counterDepth - STALL.servingGap);
  const wall = lerp(warm, [120, 40, 40], 0.3);
  // the posts are the wall's colour in shadow rather than plain ink, so they read as part of the stall
  const post = lerp(wall, INK, 0.55);
  b.box(left, 3, 0, 0, t - 6, roofAt(wallDepth), wallDepth, wall, {
    rise: roofAt(0) - roofAt(wallDepth),
    topOnly: true,
  });
  for (const [px, pz] of [
    [2, 0],
    [t - 4, 0],
    [2, d - 2],
    [t - 4, d - 2],
  ] as const) {
    b.box(left, px, 0, pz, 2, roofAt(pz + 1), 2, post);
  }
  b.box(left, 0, 0, d - STALL.counterDepth, t, r, STALL.counterDepth, lerp(INK, [60, 20, 30], 0.35));
  b.box(left, 0, r, d - STALL.counterDepth, t, 1, STALL.counterDepth, lerp(warm, INK, 0.25), { emissive: true });

  // roof: a slab sloping up toward the back, striped or solid with a signboard
  if (awning.kind === "stripes") {
    b.box(left, -4, l, roofBack, t + 8, 1.5, roofDepth, lerp(awning.neon, INK, 0.5), {
      rise: awning.rise,
      stripes: awning.stripes,
    });
  } else {
    b.box(left, -4, l, roofBack, t + 8, 1.5, roofDepth, lerp(INK, [70, 36, 30], 0.4), { rise: awning.rise });
    // the word as free-standing neon on the roof's front edge, painted with its glow on the sheet
    const { height: signH, width: signW } = signBoard(plan);
    const word = sheet.signs[index];
    if (word) {
      const pad = SIGN_GLOW_PAD;
      b.sprite(left, t / 2 - signW / 2 - pad, l + 1 - pad, d + 4.3, signW + 2 * pad, signH + 2 * pad, word);
    }
  }

  // painted details on their own planes: curtains behind the counter, patrons at it, lanterns on the posts
  const curtain = sheet.curtains[variant];
  if (curtain) {
    b.sprite(left, 4, l - curtain.height, wallDepth + 1, curtain.width, curtain.height, curtain);
  }
  const patrons = sheet.patrons[variant];
  if (patrons && plan.patrons.length) {
    b.sprite(left, 0, 0, d + 1.5, patrons.width, patrons.height, patrons);
  }
  if (plan.lanterns) {
    for (const lx of [2, t - 2]) {
      b.sprite(left, lx - LANTERN_CELL / 2, l - LANTERN_CELL, d - 0.5, LANTERN_CELL, LANTERN_CELL, sheet.lantern);
      // each lantern is a small red-orange light of its own
      b.glow(left, lx, l - LANTERN_LIGHT_Y, d - 0.5, STALL.lantern.radius, LANTERN_LIGHT, STALL.lantern.strength);
    }
  }

  // warm glow: a volumetric ball of haze around the stall and a painted pool of light on the ground
  b.glow(left, t / 2, STALL.glow.height * l, 0.5 * d, STALL.glow.radius * t, warm);
  b.sprite(left, t / 2 - t, 2 / STALL.scale, 0.5 * d + 0.7 * t, 2 * t, 1.4 * t, sheet.glow[plan.glow], true);

  // hanging bulbs along the front edge of the roof
  for (let k = 0; k < plan.bulbs; k++) {
    const bx = 4 + ((t - 8) / plan.bulbs) * (k + 0.5);
    const by = l - 7 - 2 * Math.sin(((k + 0.5) / plan.bulbs) * Math.PI);
    b.bulb(left, bx, by, d + 1);
  }

  const k = STALL.scale;
  b.smokeSources.push({
    left: left + 0.2 * t * k,
    width: 0.6 * t * k,
    x: left + (t * k) / 2,
    y: b.groundY + (r + 2) * k,
    z: b.backZ + (d - 5) * k,
  });
};

/** Builds every stall's boxes, sprites, bulbs and smoke sources for the layout; pure given the sheet. */
export const buildStallParts = (layout: CityLayout, placements: Placement[], sheet: StallSheet): StallParts => {
  const builder = new StallBuilder(layout.groundY, layout.stallZ);

  placements.forEach((placement, index) => {
    addStall(builder, placement, index, sheet);
  });

  return {
    boxes: {
      color: Float32Array.from(builder.boxColors),
      count: builder.boxCount,
      offset: Float32Array.from(builder.boxes.filter((_, i) => i % 6 < 3)),
      params: Float32Array.from(builder.boxParams),
      size: Float32Array.from(builder.boxes.filter((_, i) => i % 6 >= 3)),
    },
    bulbs: {
      count: builder.bulbCount,
      position: Float32Array.from(builder.bulbs),
      radii: Float32Array.from(builder.bulbRadii),
    },
    details: {
      count: builder.detailCount,
      flat: Float32Array.from(builder.detailFlat),
      offset: Float32Array.from(builder.details.filter((_, i) => i % 5 < 3)),
      size: Float32Array.from(builder.details.filter((_, i) => i % 5 >= 3)),
      uv: Float32Array.from(builder.detailUv),
    },
    glows: {
      center: Float32Array.from(builder.glowCenters),
      color: Float32Array.from(builder.glowColors),
      count: builder.glowCount,
      radius: Float32Array.from(builder.glowRadii),
    },
    smokeSources: builder.smokeSources,
  };
};

export { GLOW_CELL };
