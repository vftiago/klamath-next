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

export type CityLayer = {
  buildings: Building[];
  config: LayerConfig;
  index: number;
  /** World units per reference pixel at this depth. */
  scale: number;
  /** Skyline height (tallest possible building) at this depth, world units. */
  skylineHeight: number;
  z: number;
};

export type CityLayout = {
  groundY: number;
  layers: CityLayer[];
};

/** Side-face depth that projects to the reference's fake trapezoid width: ~0.68 * side * width. */
const DEPTH_FACTOR = 0.68;

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

  return { buildings, config, index, scale, skylineHeight, z: config.z };
};

/**
 * Pure, deterministic city layout. Same seed and aspect always yield the same city.
 * No three.js imports here: the output is plain data that components turn into instanced attributes.
 */
export const generateCity = (aspect: number, seed: number = SEED): CityLayout => ({
  groundY: GROUND_Y,
  layers: LAYERS.map((config, index) => generateLayer(config, index, aspect, seed)),
});
