/**
 * City scene configuration.
 *
 * Sizes in `LAYERS` are "reference pixels": screen pixels on a ~1500px wide viewport, taken from the
 * nanodrops reference. `generate.ts` multiplies them by each layer's depth scale so that, seen from the
 * default camera, a far building projects to the same screen size the reference drew it at.
 */

export const CAMERA = {
  far: 10000,
  fov: 45,
  near: 1,
  /** Default camera distance from the nearest layer (z = 0). */
  z: 1024,
} as const;

/** Visible world height at z = 0 from the default camera: 2 * z * tan(fov / 2). */
export const REF_VIEW_HEIGHT = 2 * CAMERA.z * Math.tan((CAMERA.fov / 2) * (Math.PI / 180));

/** The skyline occupies 70% of the reference viewport; the river the bottom 30%. */
export const SKYLINE_RATIO = 0.7;

/** World y of the ground line / river surface, shared by all layers. */
export const GROUND_Y = -250;

/** Gap between the nearest layer's deepest front face and the stall plane, world units. */
export const STALL_CLEARANCE = 8;

/** Pavement depth in front of the stall plane; its far edge is the river's shoreline. */
export const PAVEMENT_DEPTH = 20;

/** Stall sprites are painted at the reference's size and drawn at this scale. */
export const STALL_SCALE = 0.7;

/** Stalls per cluster (min, extra) and the gap between clusters (min, extra), reference px. */
export const STALL_CLUSTER = { extra: 3, min: 2 } as const;
export const STALL_CLUSTER_GAP = { extra: 170, min: 70 } as const;

/** Extra width generated beyond the visible frustum so camera moves and parallax never reveal an edge. */
export const WIDTH_MARGIN = 1.6;

export const SEED = 2024;

export type LayerConfig = {
  /** Fog plane alpha between this layer and the next (phase 2). */
  fog: number;
  /** Per-window brightness scale. */
  glow: number;
  /** Pink haze alpha toward the base of the layer. */
  haze: number;
  /** Probability a window is lit. */
  lit: number;
  /** Building width range, reference px. */
  maxW: number;
  minW: number;
  /** Reference parallax amplitude (kept for fog scroll speed and frame-building sizing). */
  px: number;
  /** Visible side-face amount; 0 = flat billboard, 1 = full box depth. */
  side: number;
  /** Tallest building as a fraction of the skyline height. */
  top: number;
  /** Window cell: [width, gapX, height, gapY] in reference px. */
  win: readonly [number, number, number, number];
  /** World z of the layer; the nearest layer sits at 0. */
  z: number;
};

export const LAYERS: readonly LayerConfig[] = [
  {
    fog: 0.5,
    glow: 0.34,
    haze: 0.3,
    lit: 0.18,
    maxW: 44,
    minW: 16,
    px: 4,
    side: 0.6,
    top: 0.9,
    win: [2, 2, 2, 3],
    z: -2000,
  },
  {
    fog: 0.45,
    glow: 0.42,
    haze: 0.22,
    lit: 0.2,
    maxW: 58,
    minW: 22,
    px: 7,
    side: 0.7,
    top: 0.82,
    win: [2, 3, 3, 4],
    z: -1300,
  },
  {
    fog: 0.4,
    glow: 0.5,
    haze: 0.15,
    lit: 0.22,
    maxW: 78,
    minW: 30,
    px: 11,
    side: 0.8,
    top: 0.72,
    win: [3, 4, 4, 5],
    z: -800,
  },
  {
    fog: 0.34,
    glow: 0.56,
    haze: 0.08,
    lit: 0.23,
    maxW: 106,
    minW: 42,
    px: 17,
    side: 0.85,
    top: 0.62,
    win: [3, 5, 4, 6],
    z: -450,
  },
  {
    fog: 0.26,
    glow: 0.6,
    haze: 0.03,
    lit: 0.22,
    maxW: 140,
    minW: 60,
    px: 25,
    side: 0.9,
    top: 0.54,
    win: [4, 6, 6, 8],
    z: -200,
  },
  { fog: 0, glow: 0.62, haze: 0, lit: 0.2, maxW: 180, minW: 84, px: 36, side: 1, top: 0.46, win: [5, 8, 7, 9], z: 0 },
];

export const NEAREST_LAYER = LAYERS.length - 1;

/**
 * Block depth. A building's depth is `width * DEPTH_FACTOR * side`, varied per building by a random factor in
 * `DEPTH_VARIATION`, then capped so its front face stays short of the fog plane in front of the layer
 * (`FRONT_LIMIT_RATIO` of the gap to the nearer layer; the nearest layer uses `NEAREST_FRONT_LIMIT`).
 */
export const DEPTH_FACTOR = 0.85;
export const DEPTH_VARIATION = { extra: 0.6, min: 0.7 } as const;
export const FRONT_LIMIT_RATIO = 0.3;
export const NEAREST_FRONT_LIMIT = 100;

/**
 * Back row: a second, lower row of boxes behind each layer's front row, separated by a small alley and
 * reaching at most `BACK_LIMIT_RATIO` of the gap to the farther layer. Heights are `top * (min + extra * r)`.
 */
export const BACK_LIMIT_RATIO = 0.55;
export const BACK_ROW_HEIGHT = { extra: 0.55, min: 0.15 } as const;
/** Back-row depth as a fraction of the space behind the front row: `min + extra * r`. */
export const BACK_ROW_DEPTH = { extra: 0.55, min: 0.45 } as const;
/** Alley between the rows, reference px. */
export const ALLEY = 6;
/** Gap the far layer's back row may use (it has no farther neighbour), world units. */
export const FAR_LAYER_BACK_GAP = 700;

/**
 * Streets: a wider gap every `STREET_EVERY.min + rand * STREET_EVERY.extra` buildings, running through both
 * rows. Width in reference px grows with the layer index so far layers keep a dense silhouette.
 */
export const STREET_EVERY = { extra: 2, min: 3 } as const;
export const streetWidth = (index: number, r: number): number => (6 + 5 * index) * (1 + r);

/** World units per reference pixel at depth z (1 at z = 0). */
export const depthScale = (z: number): number => (CAMERA.z - z) / CAMERA.z;

/** Visible world width at depth z for the given viewport aspect. */
export const visibleWidthAt = (z: number, aspect: number): number => aspect * REF_VIEW_HEIGHT * depthScale(z);
