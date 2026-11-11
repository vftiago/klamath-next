/**
 * City scene configuration.
 *
 * Sizes in `GRID` and `ROW_STYLE` are "reference pixels": screen pixels on a ~1500px wide viewport, taken from
 * the nanodrops reference. `buildRows` multiplies them by each row's depth scale so that, seen from the default
 * camera, a far building projects to the same screen size the reference drew it at (see `GRID.perspective`).
 */

export const CAMERA = {
  far: 10000,
  fov: 45,
  near: 1,
  /**
   * Distance of the home camera from the nearest row's street edge (z = 0). Every reference-px size, depth
   * scale and frustum estimate is anchored to it, and `ThreeScene` places the home camera here, so the
   * generated city projects at reference size from where it is actually viewed. Keep them one number.
   */
  z: 1024,
} as const;

/** Visible world height at z = 0 from the default camera: 2 * z * tan(fov / 2). */
export const REF_VIEW_HEIGHT = 2 * CAMERA.z * Math.tan((CAMERA.fov / 2) * (Math.PI / 180));

/** The skyline occupies 70% of the reference viewport; the river the bottom 30%. */
export const SKYLINE_RATIO = 0.7;

/** World y of the ground line / river surface, shared by all layers. */
export const GROUND_Y = -250;

/**
 * Street stalls: every tuning knob in one place. Sizes are reference px unless noted; the stalls are planned
 * at the reference's size and built at `scale`. Colours and the exact part layout live in `Stalls/`.
 */
export const STALL = {
  /** Height of the body (ground to the roof's front edge), reference px (min, extra). */
  bodyHeight: { extra: 12, min: 30 },
  /** Gap between the nearest layer's deepest front face and the stall plane, world units. */
  clearance: 42,
  /** Stalls per cluster (min, extra). */
  cluster: { extra: 2, min: 1 },
  /** Gap between clusters (min, extra), world units. */
  clusterGap: { extra: 32, min: 24 },
  /** Depth of the counter at the front of the footprint. */
  counterDepth: 10,
  /** Height of the counter block at the front, reference px (min, extra). */
  counterHeight: { extra: 3, min: 9 },
  /** Footprint depth (min, extra); independent of width so wide stalls don't balloon. */
  depth: { extra: 16, min: 40 },
  /**
   * Volumetric haze around each stall: `peak` is the haze added through a sphere's centre (lanterns included),
   * `radius` a multiple of the stall width, `height` the centre's height as a fraction of the body height.
   */
  glow: { height: 0.45, peak: 0.05, radius: 1.5 },
  /** Lantern lights: chance a variant hangs them, sphere radius, and strength relative to `glow.peak`. */
  lantern: { chance: 0.6, radius: 35, strength: 3 },
  /** Pavement depth in front of the stall plane (the footprints included), world units; its far edge is the shoreline. */
  pavementDepth: 60,
  /** World units per reference px. */
  scale: 0.7,
  /** Space kept free between the kitchen block and the counter for whoever is serving. */
  servingGap: 8,
  /** Number of painted variants. */
  variants: 10,
  /** Stall width, reference px (min, extra). */
  width: { extra: 24, min: 48 },
} as const;

/** Extra width generated beyond the visible frustum so camera moves and parallax never reveal an edge. */
export const WIDTH_MARGIN = 1.6;

/**
 * Viewport aspect the layout is generated for, whatever the real one, so every screen width gets the same
 * buildings and signs; whatever falls outside the real viewport's span is culled afterwards. A viewport wider
 * than this would reveal the layout's edge, so raise it rather than the margin if that ever happens.
 */
export const GENERATION_ASPECT = 2.4;

export type Seeds = {
  /** Skeleton: buildings, streets, back rows and roof furniture. */
  city: number;
  /** Decorative neon signs, rolled per building; independent of `city`. */
  sign: number;
  /** Street stalls: their variants, placement and header words; independent of `city` and `sign`. */
  stall: number;
};

/**
 * Committed seeds. `?seed=<n>`, `?signSeed=<n>` and `?stallSeed=<n>` override them for a session (see
 * `seeds.ts`).
 */
export const SEEDS: Seeds = { city: 2024, sign: 2024, stall: 16 };

/** Letter size of a sign type: the row's `cell` times a factor rolled in [min, max] per sign. */
export type CellScale = { max: number; min: number };

/** Neon brightness multipliers (1 = the reference look): the border's halo and core, and the text. */
export type Brightness = { borderCore: number; borderHalo: number; text: number };

/** A colour as 0-255 RGB. */
export type Rgb = readonly [number, number, number];

/** The knobs every sign type has. `SIGN_BASE` holds the defaults; each `SIGNAGE` type block spreads it and overrides. */
export type SignStyle = {
  /** Box background at the far and near rows, linear in between. */
  backing: { far: Rgb; near: Rgb };
  /** Border tube width, reference px; never wider than the box margin. 0 removes the border, halo included. */
  borderWidth: number;
  brightness: Brightness;
  /** Base letter size at the far and near rows, reference px, geometric in between. */
  cell: RowPair;
  cellScale: CellScale;
  /** Brightness at the far and near rows, linear in between. */
  dim: RowPair;
  /** Corner radius of the box, reference px. */
  radius: number;
};

/** The look knobs: what the shader reads per sign besides its text and box, so a hover style can swap them live. */
export type SignLookStyle = Pick<SignStyle, "backing" | "borderWidth" | "brightness" | "dim" | "radius">;

/** A look applied while a sign is hovered; `steady` holds its flicker driver at full brightness meanwhile. */
export type SignHoverStyle = SignLookStyle & { steady: boolean };

/** Defaults every sign type inherits (`SIGNAGE.<type>` spreads this, then overrides what differs). */
export const SIGN_BASE: SignStyle = {
  backing: { far: [16, 3, 30], near: [8, 3, 16] },
  borderWidth: 0.3,
  brightness: { borderCore: 0.3, borderHalo: 0.2, text: 1 },
  cell: { far: 6, near: 18 },
  cellScale: { max: 1.2, min: 1 },
  dim: { far: 0.3, near: 1 },
  radius: 2,
};

/**
 * Signage: one block per sign type, each `SIGN_BASE` plus overrides and the type's own knobs (the horizontal
 * types, facade and billboard, bound their box by `width`, a fraction of the building width), and the two
 * knobs about rolling signs at all (`chance`, `flakyChance`). Reference px unless noted. Text lives in
 * `signage.ts`. The frame signs are authored and always placed; every other sign is rolled per building and
 * only placed where it has `blade.breathing` room from any building, roof furniture or other sign in its
 * layer's front plane.
 */
export const SIGNAGE = {
  /**
   * Billboards: rooftop boards (layers 2 and nearer, on the billboard roof roll) built around a slogan like a
   * facade sign. The slogan is picked among those whose board is within `width.max` of the roof, preferring
   * those reaching `width.min`; a roof too narrow for every slogan gets other furniture. Its letters then grow
   * until the board reaches `width.max`, up to `grow` times the rolled cell (1 = no growth), so short slogans
   * on wide roofs read as hoardings. The board stands on two posts `perHeight` of its height tall, clamped to
   * [min, max].
   */
  billboard: {
    ...SIGN_BASE,
    // backing: { far: [37, 17, 61], near: [18, 14, 27] },
    // borderWidth: 1,
    cellScale: { max: 1, min: 1 },
    // dim: { far: 0.45, near: 0.95 },
    grow: 1.2,
    post: { max: 4, min: 2, perHeight: 0.2 },
    radius: 0,
    width: { max: 0.9, min: 0.7 },
  },
  /**
   * Blade signs: rolled vertical signs hung beside a building edge on two short poles. `gap` is the distance
   * from the edge, `perCell` of the character cell clamped to [min, max], so small far-layer signs sit close
   * and the big frame signs keep their reach; `bracket` is the poles' inset from the sign's ends and thickness;
   * `breathing` the clear space kept around the sign (and below the frame signs).
   */
  blade: {
    ...SIGN_BASE,
    bracket: { inset: 8, thickness: 2 },
    breathing: 4,
    cellScale: { max: 1.2, min: 1 },
    gap: { max: 6, min: 2, perCell: 0.3 },
  },
  /** Chance a front building gets a rolled sign: middle layers by height, the nearest layer, the rest. The far layer gets none. */
  chance: { middleShort: 0.03, middleTall: 0.5, nearest: 0.28, other: 0.2 },
  /**
   * Facade signs: rolled horizontal signs flat on the facade over a windowless band. `chance` is the chance a
   * rolled sign is tried flat first rather than as a blade; `width` the share of the facade the word must span.
   */
  facade: {
    ...SIGN_BASE,
    chance: 0.4,
    width: { max: 0.9, min: 0.55 },
  },
  /** Chance a sign's driver may stutter, drop out or brown out. */
  flakyChance: 0.55,
  /**
   * Frame signs: the authored blade signs on the frame buildings. `top` is the first sign's distance below
   * the roof (min, extra), `gap` the space between signs (min, extra), `bottomMargin` the space kept above the
   * frame building's foot; a building narrowed to clear the signs' strip is dropped if less than `trimKeep` of
   * the layer's `minW` remains.
   */
  frame: {
    ...SIGN_BASE,
    bottomMargin: 90,
    cellScale: { max: 1.6, min: 1.6 },
    gap: { extra: 0, min: 8 },
    radius: 4,
    top: { extra: 30, min: 90 },
    trimKeep: 0.6,
  },
  /**
   * Frame signs while hovered: the look knobs swapped in live for the sign under the pointer (its box and
   * letters stay put). Brighter and steadier than `frame`, so the linked blades read as buttons.
   */
  frameHover: {
    ...SIGN_BASE,
    backing: { far: [40, 10, 70], near: [28, 8, 52] },
    borderWidth: 1,
    brightness: { borderCore: 1, borderHalo: 0.4, text: 1.2 },
    radius: 4,
    steady: true,
  } satisfies SignHoverStyle,
} as const;

/** World units per reference pixel at depth z (1 at z = 0). */
export const depthScale = (z: number): number => (CAMERA.z - z) / CAMERA.z;

/** Visible world width at depth z for the given viewport aspect. */
export const visibleWidthAt = (z: number, aspect: number): number => aspect * REF_VIEW_HEIGHT * depthScale(z);

/** A value given at the far and near ends of the city, interpolated per row by its depth `t`. */
export type RowPair = { readonly far: number; readonly near: number };

/** Linear interpolation of a far/near pair for a row's `t` (0 = far row, 1 = nearest row); for looks. */
export const lerpRow = (pair: RowPair, t: number): number => pair.far + (pair.near - pair.far) * t;

/** Geometric interpolation of a far/near pair (constant ratio per row); for sizes, which grow like the depth scale. */
export const lerpRowGeo = (pair: RowPair, t: number): number => pair.far * Math.pow(pair.near / pair.far, t);

export type GridConfig = {
  /** Gap after each building within a row, reference px, random in [min, max]. */
  alley: { max: number; min: number };
  /** Depth range a row's buildings may occupy behind its street edge, reference px. */
  band: RowPair;
  /**
   * Cross streets: a gap `width * (1 + rand)` every `every.min + rand * every.extra` buildings, never beside
   * the frame buildings. Staggered per row by default; `aligned` rolls one set of world-x streets from the
   * nearest row's walk that every other row jumps past, so the rows form blocks.
   */
  crossStreet: { aligned: boolean; every: { extra: number; min: number }; width: RowPair };
  /** Building depth as a multiple of its width, random in [min, max], clamped to the band. */
  depth: { max: number; min: number };
  /**
   * How much of the depth scale applies to reference sizes: 1 is the reference model (a far row is built
   * larger in world space so it projects at its reference size from the default camera); 0 is pure world units
   * (every row the same size, perspective alone shrinks the far ones). `scale = depthScale(z) ** perspective`.
   */
  perspective: number;
  rows: number;
  /** Furthest a building stands back from its row's street edge, as a fraction of the band. 0 = straight line. */
  setback: number;
  /** Inviolable gap between a row and the next one behind it, reference px. */
  street: RowPair;
};

/**
 * The city grid: `rows` rows of buildings, the nearest at z = 0, each owning a band of depth with a street
 * behind it. Row z positions are derived by walking band + street back from the nearest row, so rows can
 * never overlap and every building fits its band (`buildRows` validates `band >= depth.min * maxW`).
 *
 * These are the reference values the grid was introduced with (`f8ca8e4`). Leave them as they are and tune
 * `GRID` below instead, so the defaults are always there to compare against or go back to.
 */
export const DEFAULT_GRID: GridConfig = {
  alley: { max: 8, min: 0 },
  band: { far: 60, near: 180 },
  crossStreet: { aligned: false, every: { extra: 2, min: 3 }, width: { far: 6, near: 31 } },
  depth: { max: 1.1, min: 0.6 },
  perspective: 1,
  rows: 6,
  setback: 0.33,
  street: { far: 20, near: 60 },
};

/**
 * The grid the city is generated with: `DEFAULT_GRID` plus any overrides. Override a nested field by spreading
 * its default, e.g. `street: { ...DEFAULT_GRID.street, near: 40 }`.
 */
export const GRID: GridConfig = {
  ...DEFAULT_GRID,
  alley: { max: 0, min: 0 },
  crossStreet: { aligned: false, every: { extra: 2, min: 5 }, width: { far: 6, near: 8 } },
  rows: 8,
  setback: 0,
  street: { far: 255, near: 20 },
};

/** Look and sizing of a row; given at the far and near ends in `ROW_STYLE`, interpolated per row. */
export type RowStyle = {
  /** Fog plane alpha in the street ahead of the row. */
  fog: number;
  /** Per-window brightness scale. */
  glow: number;
  /** Pink haze alpha toward the base of the row. */
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
};

/** Looks (`fog`, `glow`, `haze`, `lit`, `side`, `top`) interpolate linearly; sizes (`maxW`, `minW`, `px`, `win`) geometrically. */
export const ROW_STYLE: { far: RowStyle; near: RowStyle } = {
  far: {
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
  },
  near: { fog: 0.2, glow: 0.62, haze: 0, lit: 0.2, maxW: 180, minW: 84, px: 36, side: 1, top: 0.46, win: [5, 8, 7, 9] },
};

/** One row of the grid: its interpolated style plus everything the walk derives. */
export type LayerConfig = RowStyle & {
  /** Depth range the row's buildings may occupy behind `z`, world units. */
  band: number;
  /** z of the fog plane in the street ahead of this row (toward the camera); null for the nearest row. */
  fogZ: null | number;
  /** 0 = far row, `GRID.rows - 1` = nearest. */
  index: number;
  /** World units per reference px for this row. */
  scale: number;
  /** Street behind the row, world units. */
  street: number;
  /** Depth position for interpolation: 0 = far row, 1 = nearest. */
  t: number;
  /** World z of the row's street edge (the front building line); the nearest row sits at 0. */
  z: number;
};

const styleAt = (style: { far: RowStyle; near: RowStyle }, t: number): RowStyle => {
  const { far, near } = style;
  const lin = (key: "fog" | "glow" | "haze" | "lit" | "side" | "top") => lerpRow({ far: far[key], near: near[key] }, t);
  const geo = (key: "maxW" | "minW" | "px") => lerpRowGeo({ far: far[key], near: near[key] }, t);
  const win = far.win.map((value, i) => lerpRowGeo({ far: value, near: near.win[i] ?? value }, t)) as [
    number,
    number,
    number,
    number,
  ];

  return {
    fog: lin("fog"),
    glow: lin("glow"),
    haze: lin("haze"),
    lit: lin("lit"),
    maxW: geo("maxW"),
    minW: geo("minW"),
    px: geo("px"),
    side: lin("side"),
    top: lin("top"),
    win,
  };
};

/**
 * Walks the grid from the nearest row (z = 0) back, deriving each row's scale, band, street and z, and returns
 * the rows in index order (0 = far). Throws when a band is too shallow for the row's widest building at
 * `GRID.depth.min`, so a bad config fails at module load rather than thinning or dropping buildings.
 */
export const buildRows = (grid: GridConfig = GRID, style = ROW_STYLE): readonly LayerConfig[] => {
  const rows: LayerConfig[] = [];
  let z = 0;

  for (let n = 0; n < grid.rows; n++) {
    const index = grid.rows - 1 - n;
    const t = grid.rows > 1 ? index / (grid.rows - 1) : 1;
    const scale = Math.pow(depthScale(z), grid.perspective);
    const row = styleAt(style, t);
    const band = lerpRow(grid.band, t) * scale;
    const street = lerpRow(grid.street, t) * scale;
    const needed = grid.depth.min * row.maxW;

    if (band / scale < needed) {
      throw new Error(
        `GRID.band at row ${index} is ${(band / scale).toFixed(1)} reference px; its widest building needs ${needed.toFixed(1)} (depth.min * maxW)`,
      );
    }

    // the street ahead belongs to the nearer row (walked just before); its fog plane sits mid-street
    const nearer = rows[rows.length - 1];
    const fogZ = nearer ? z + nearer.street / 2 : null;

    rows.push({ ...row, band, fogZ, index, scale, street, t, z });
    z -= band + street;
  }

  return rows.reverse();
};

export const ROWS = buildRows();

export const NEAREST_LAYER = GRID.rows - 1;
