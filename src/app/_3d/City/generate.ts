import { mulberry32 } from "../utils";
import type { LayerConfig } from "./config";
import {
  depthScale,
  GROUND_Y,
  LAYERS,
  NEAREST_LAYER,
  REF_VIEW_HEIGHT,
  SEED,
  SKYLINE_RATIO,
  visibleWidthAt,
  WIDTH_MARGIN,
} from "./config";

/** Window layout: 0 = grid, 1 = horizontal bands, 2 = tall columns. */
export type WindowPattern = 0 | 1 | 2;

export type Building = {
  /** Box depth (z extent), world units. */
  depth: number;
  /** Full-height edge building on the nearest layer that anchors the big vertical signs. */
  frame: boolean;
  height: number;
  pattern: WindowPattern;
  /** Four reusable random values (roof details, sign placement, edge-line color...). */
  rands: readonly [number, number, number, number];
  /** Roof type selector in [0, 1); see the plan's "Buildings" spec. */
  roof: number;
  /** Per-building seed for the window hash in the shader. */
  seed: number;
  width: number;
  /** World x of the building's center. */
  x: number;
};

/** A plain box (no windows) used for roof furniture; `baseY` is relative to the ground line. */
export type PlainBox = {
  baseY: number;
  depth: number;
  height: number;
  width: number;
  x: number;
};

/** Blinking red antenna light; `y` is relative to the ground line. */
export type Beacon = {
  phase: number;
  x: number;
  y: number;
};

/** Rooftop billboard: a vertical board with a neon frame and text bars; `y` is its center, ground-relative. */
export type Billboard = {
  /** Neon color slot (0-4), weighted pink/cyan/lime like the signs. */
  colorSlot: number;
  height: number;
  width: number;
  x: number;
  y: number;
  /** z of the board plane, relative to the layer's z. */
  z: number;
};

export type CityLayer = {
  beacons: Beacon[];
  billboards: Billboard[];
  buildings: Building[];
  config: LayerConfig;
  /** Roof furniture (water towers, antennas, HVAC, billboard posts) drawn as plain boxes. */
  details: PlainBox[];
  index: number;
  /** World units per reference pixel at this depth. */
  scale: number;
  /** Skyline height (tallest possible building) at this depth, world units. */
  skylineHeight: number;
  /** Generated width of the layer (visible width plus margin), world units. */
  span: number;
  z: number;
};

export type CityLayout = {
  groundY: number;
  layers: CityLayer[];
};

/** Side-face depth that projects to the reference's fake trapezoid width: ~0.68 * side * width. */
const DEPTH_FACTOR = 0.68;

type RoofFurniture = Pick<CityLayer, "beacons" | "billboards" | "details">;

/**
 * Roof furniture per the reference's roof-type roll. Sizes are reference px scaled to the layer.
 * Each building's four `rands` drive the variations so the result is stable for a given layout.
 */
const generateRoof = (building: Building, index: number, scale: number, side: number): RoofFurniture => {
  const out: RoofFurniture = { beacons: [], billboards: [], details: [] };

  if (building.frame) {
    return out;
  }

  const { height: top, rands, roof, width, x } = building;
  const [r0, r1, r2, r3] = rands;
  const left = x - width / 2;
  const depthOf = (w: number) => Math.max(1, Math.min(building.depth, w * DEPTH_FACTOR * side));
  const box = (bx: number, baseY: number, w: number, h: number): PlainBox => ({
    baseY,
    depth: depthOf(w),
    height: h,
    width: w,
    x: bx + w / 2,
  });

  if (roof < 0.26) {
    // water tower, sometimes with a spike
    const towerW = width * (0.45 + 0.3 * r0);
    const towerH = (8 + r1 * (16 + 6 * index)) * scale;
    out.details.push(box(left + (width - towerW) / 2, top, towerW, towerH));
    if (r2 < 0.45) {
      const spikeW = Math.max(1.5 * scale, 0.08 * towerW);
      out.details.push(box(x - spikeW / 2, top + towerH, spikeW, 1.6 * towerH));
    }
  } else if (roof < 0.48) {
    // antenna mast with a blinking beacon
    const mastH = (12 + 40 * r0) * scale;
    const mastX = left + width * (0.3 + 0.4 * r1);
    const mastW = 1.5 * scale;
    out.details.push(box(mastX - mastW / 2, top, mastW, mastH));
    if (r2 < 0.7) {
      out.beacons.push({ phase: r3 * Math.PI * 2, x: mastX, y: top + mastH });
    }
  } else if (roof < 0.64 && index >= 2) {
    // billboard on two posts
    const boardW = width * (0.5 + 0.3 * r0);
    const boardH = 0.36 * boardW;
    const boardLeft = left + (width - boardW) / 2;
    const postH = (4 + 1.5 * index) * scale;
    const postW = 1.5 * scale;
    out.details.push(box(boardLeft + 0.2 * boardW - postW / 2, top, postW, postH));
    out.details.push(box(boardLeft + 0.8 * boardW - postW / 2, top, postW, postH));
    out.billboards.push({
      colorSlot: Math.floor(r1 * 5),
      height: boardH,
      width: boardW,
      x: boardLeft + boardW / 2,
      y: top + postH + boardH / 2,
      z: building.depth / 2 + 0.5 * scale,
    });
  } else if (roof < 0.82) {
    // HVAC unit on legs plus a few small boxes
    const unit = (6 + 3 * index) * scale;
    const unitX = left + width * (0.15 + 0.2 * r0);
    out.details.push(box(unitX, top + 0.4 * unit, unit, 0.9 * unit));
    out.details.push(box(unitX + 1 * scale, top, 1 * scale, 0.4 * unit));
    out.details.push(box(unitX + unit - 2 * scale, top, 1 * scale, 0.4 * unit));
    const count = 1 + Math.floor(3 * r1);
    const small = (4 + 1.5 * index) * scale;
    for (let k = 0; k < count; k++) {
      out.details.push(box(left + width * (0.55 + 0.13 * k), top, small, 0.7 * small));
    }
  }

  return out;
};

const generateLayer = (config: LayerConfig, index: number, aspect: number, seed: number): CityLayer => {
  const rand = mulberry32(seed + 131 * index);
  const scale = depthScale(config.z);
  const skylineHeight = REF_VIEW_HEIGHT * SKYLINE_RATIO * scale;
  const span = visibleWidthAt(config.z, aspect) * WIDTH_MARGIN;
  const isNearest = index === NEAREST_LAYER;

  const buildings: Building[] = [];

  let cursor = -span / 2 - rand() * config.minW * scale;

  while (cursor < span / 2) {
    const width = (config.minW + rand() * (config.maxW - config.minW)) * scale;
    const height = skylineHeight * config.top * (0.32 + 0.68 * Math.pow(rand(), 0.85));
    const patternRoll = rand();

    buildings.push({
      depth: Math.max(1, width * DEPTH_FACTOR * config.side),
      frame: false,
      height,
      pattern: patternRoll < 0.62 ? 0 : patternRoll < 0.82 ? 1 : 2,
      rands: [rand(), rand(), rand(), rand()],
      roof: rand(),
      seed: Math.floor(rand() * 10000),
      width,
      x: cursor + width / 2,
    });

    cursor += width + (rand() < 0.35 ? rand() * (5 + 3 * index) * scale : 0);
  }

  if (isNearest) {
    // Two full-height "frame" buildings at the viewport edges, mostly off-screen, matching the reference.
    const visible = visibleWidthAt(config.z, aspect);
    const frameWidth = (config.px + Math.max(70, Math.min(210, 0.11 * visible))) * scale;
    const frameHeight = skylineHeight + 60 * scale;

    for (const side of [-1, 1] as const) {
      const innerEdge = side * (visible / 2 - (frameWidth - config.px * scale));

      buildings.push({
        depth: Math.max(1, frameWidth * DEPTH_FACTOR * config.side),
        frame: true,
        height: frameHeight,
        pattern: 0,
        rands: [0.5, 0.5, 0.5, 0.5],
        roof: 1,
        seed: 7000 + (side + 1),
        width: frameWidth,
        x: innerEdge + (side * frameWidth) / 2,
      });
    }
  }

  const furniture: RoofFurniture = { beacons: [], billboards: [], details: [] };

  for (const building of buildings) {
    const roof = generateRoof(building, index, scale, config.side);
    furniture.beacons.push(...roof.beacons);
    furniture.billboards.push(...roof.billboards);
    furniture.details.push(...roof.details);
  }

  return { ...furniture, buildings, config, index, scale, skylineHeight, span, z: config.z };
};

/**
 * Pure, deterministic city layout. Same seed and aspect always yield the same city.
 * No three.js imports here: the output is plain data that components turn into instanced attributes.
 */
export const generateCity = (aspect: number, seed: number = SEED): CityLayout => ({
  groundY: GROUND_Y,
  layers: LAYERS.map((config, index) => generateLayer(config, index, aspect, seed)),
});
