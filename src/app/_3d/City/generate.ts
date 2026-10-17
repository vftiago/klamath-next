import { mulberry32 } from "../utils";
import type { Seeds } from "./config";
import {
  ALLEY,
  BACK_LIMIT_RATIO,
  BACK_ROW_DEPTH,
  BACK_ROW_HEIGHT,
  BILLBOARD,
  DEPTH_FACTOR,
  DEPTH_VARIATION,
  depthScale,
  FAR_LAYER_BACK_GAP,
  FRONT_LIMIT_RATIO,
  GENERATION_ASPECT,
  GROUND_Y,
  LAYERS,
  NEAREST_FRONT_LIMIT,
  NEAREST_LAYER,
  REF_VIEW_HEIGHT,
  SEEDS,
  SIGNAGE,
  SKYLINE_RATIO,
  STALL,
  STREET_EVERY,
  streetWidth,
  visibleWidthAt,
  WIDTH_MARGIN,
} from "./config";
import type { LayerConfig } from "./config";
import { BILLBOARD_POOL, FRAME_SIGNS, MAX_TEXT_CHARS, SIGN_POOL } from "./signage";

/** Window layout: 0 = grid, 1 = horizontal bands, 2 = tall columns. */
export type WindowPattern = 0 | 1 | 2;

export type Building = {
  /** Window-free band behind a facade-mounted sign: [top, bottom] measured down from the roof, world units. */
  blank: null | readonly [number, number];
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
  /** Box center z relative to the layer's z (0 = the layer's front row). */
  z: number;
};

/** A plain box (no windows) used for roof furniture and sign brackets; `baseY` is relative to the ground line. */
export type PlainBox = {
  baseY: number;
  depth: number;
  height: number;
  /** Window pattern value the shader should use: 3 = building color, 4 = lighter metal. */
  pattern?: number;
  width: number;
  x: number;
  /** Box center z relative to the layer's z (default 0, the building centers). */
  z?: number;
};

/** Blinking red antenna light; `y` is relative to the ground line. */
export type Beacon = {
  phase: number;
  x: number;
  y: number;
  /** Relative to the layer's z. */
  z: number;
};

/** Rooftop billboard: a vertical board with a neon frame and text bars; `y` is its center, ground-relative. */
export type Billboard = {
  /** Neon color slot (0-4), weighted pink/cyan/lime like the signs. */
  colorSlot: number;
  height: number;
  text: string;
  width: number;
  x: number;
  y: number;
  /** z of the board plane, relative to the layer's z. */
  z: number;
};

/** How a sign is attached: flat on the facade over a windowless band, or hung beside an edge on brackets. */
export type SignMount = "blade" | "facade";

/** A neon sign. Position is the box's bottom-left corner, ground-relative y. */
export type Sign = {
  /** Character cell size, world units. */
  cell: number;
  /** Neon color slot (0-4), weighted pink/cyan/lime. */
  colorSlot: number;
  /** Index of a permanently dark character, or -1. */
  dead: number;
  /** Whether the sign's driver may stutter, drop out or brown out. */
  flaky: boolean;
  /** True for the big blade signs on the edge frame buildings. */
  framed: boolean;
  height: number;
  /** Route the sign navigates to once signs are clickable; authored signs only. */
  href?: string;
  /** Stable id: the frame record's id, or `layer:buildingSeed:ordinal` for rolled signs. */
  id: string;
  /** Box margin around the character cells, world units. */
  margin: number;
  mount: SignMount;
  phase: number;
  text: string;
  vertical: boolean;
  width: number;
  x: number;
  y: number;
  /** z of the sign plane relative to the layer's z. */
  z: number;
};

export type CityLayer = {
  beacons: Beacon[];
  billboards: Billboard[];
  buildings: Building[];
  config: LayerConfig;
  /** Roof furniture (water towers, antennas, HVAC, billboard posts) drawn as plain boxes. */
  details: PlainBox[];
  signs: Sign[];
  index: number;
  /** World units per reference pixel at this depth. */
  scale: number;
  /** Skyline height (tallest possible building) at this depth, world units. */
  skylineHeight: number;
  /** Width of the layer kept after culling (visible width plus margin), world units. */
  span: number;
  z: number;
};

/** The rooftop searchlight and its hovering badge: on the tallest central building of the second-nearest layer. */
export type Searchlight = {
  /** Badge radius, world units. */
  radius: number;
  /** Roof height above the ground line. */
  roofY: number;
  x: number;
  /** World z of the roof's front edge. */
  z: number;
};

export type CityLayout = {
  groundY: number;
  layers: CityLayer[];
  searchlight: null | Searchlight;
  /** World z where the pavement ends and the water begins (the river's shoreline). */
  shoreZ: number;
  /** World z of the stall plane: just in front of the nearest layer's deepest front face. */
  stallZ: number;
};

type RoofFurniture = Pick<CityLayer, "beacons" | "billboards" | "details">;

const GLYPH_PITCH = 1.18;
/** Window pattern value for bracket boxes: drawn plain in a lighter metal tone. */
export const BRACKET_PATTERN = 4;

/** Mixes a building's seed with the sign seed into a per-building PRNG seed; nearby inputs give unrelated streams. */
const mix = (a: number, b: number): number => (Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 1, 0x85ebca6b)) | 0;

/** A building's own sign stream: depends on the building (its seed and layer) and the sign seed, nothing else. */
const signStream = (building: Building, layerIndex: number, signSeed: number): (() => number) =>
  mulberry32(mix(building.seed + layerIndex * 10007, signSeed));

const signBox = (cell: number, count: number, vertical: boolean) => {
  const margin = Math.max(3, Math.round(0.3 * cell));
  const run = count * GLYPH_PITCH * cell + 2 * margin;
  const across = cell + 2 * margin;
  return { height: vertical ? run : across, margin, width: vertical ? across : run };
};

/** An axis-aligned rectangle in a layer's front plane: world x, ground-relative y. */
type Rect = { bottom: number; left: number; right: number; top: number };

const intersects = (a: Rect, b: Rect): boolean =>
  a.left < b.right && a.right > b.left && a.bottom < b.top && a.top > b.bottom;

const signRect = (sign: Sign): Rect => ({
  bottom: sign.y,
  left: sign.x,
  right: sign.x + sign.width,
  top: sign.y + sign.height,
});

const buildingRect = (building: Building): Rect => ({
  bottom: 0,
  left: building.x - building.width / 2,
  right: building.x + building.width / 2,
  top: building.height,
});

/**
 * Everything in a layer's front plane a blade sign could clip: front-row buildings, their roof furniture and
 * billboards, and the signs placed so far. Back rows stand behind every front face, so they never clip.
 */
const frontObstacles = (layer: CityLayer): Rect[] => {
  const rects: Rect[] = [];

  for (const building of layer.buildings) {
    if (building.z === 0) {
      rects.push(buildingRect(building));
    }
  }
  for (const detail of layer.details) {
    if ((detail.z ?? 0) >= 0) {
      rects.push({
        bottom: detail.baseY,
        left: detail.x - detail.width / 2,
        right: detail.x + detail.width / 2,
        top: detail.baseY + detail.height,
      });
    }
  }
  for (const board of layer.billboards) {
    if (board.z >= 0) {
      rects.push({
        bottom: board.y - board.height / 2,
        left: board.x - board.width / 2,
        right: board.x + board.width / 2,
        top: board.y + board.height / 2,
      });
    }
  }
  for (const sign of layer.signs) {
    rects.push(signRect(sign));
  }

  return rects;
};

type SignPlacement = {
  cell: number;
  framed: boolean;
  href?: string;
  id: string;
  mount: SignMount;
  text: string;
  vertical: boolean;
  /** Box left edge, world x. */
  x: number;
  /** Box top, measured down from the building's roof, in world units. */
  yFromTop: number;
};

const makeSign = (building: Building, placement: SignPlacement, scale: number, rand: () => number): Sign => {
  const { cell, framed, href, id, mount, text, vertical, x, yFromTop } = placement;
  const box = signBox(cell, text.length, vertical);

  return {
    cell: cell * scale,
    colorSlot: Math.floor(rand() * 5),
    dead: -1,
    flaky: rand() < SIGNAGE.flakyChance,
    framed,
    height: box.height * scale,
    href,
    id,
    margin: box.margin * scale,
    mount,
    phase: rand() * Math.PI * 2,
    text,
    vertical,
    width: box.width * scale,
    x,
    y: building.height - (yFromTop + box.height * scale),
    z: building.z + building.depth / 2 + 0.5 * scale,
  };
};

/** Gap between a building edge and its blade sign, reference px, for a sign with this character cell (reference px). */
const bladeGapFor = (cell: number): number => {
  const { max, min, perCell } = SIGNAGE.bladeGap;
  return Math.max(min, Math.min(max, Math.round(perCell * cell)));
};

/**
 * Two short poles tying a blade sign to the facade it hangs beside: thin rods at the facade plane that
 * bridge the gap from the building edge into the sign box, like a real wall-mounted blade sign.
 */
const bracketsFor = (building: Building, sign: Sign, side: -1 | 1, scale: number): PlainBox[] => {
  const edge = building.x + (side * building.width) / 2;
  const length = (bladeGapFor(sign.cell / scale) + 2) * scale;
  const thickness = SIGNAGE.bracket.thickness * scale;
  // the poles sit a little in from the sign's top and bottom edges
  const inset = SIGNAGE.bracket.inset * scale;
  const x = edge + (side * length) / 2;

  return [sign.y + sign.height - inset - thickness, sign.y + inset].map((baseY) => ({
    baseY,
    depth: thickness,
    height: thickness,
    pattern: BRACKET_PATTERN,
    width: length,
    x,
    // flush with the facade, just behind the sign plane
    z: sign.z - thickness / 2,
  }));
};

/** World x of a blade sign's left edge when hung on `side` of the building; `cell` and `boxWidth` in reference px. */
const bladeX = (building: Building, side: -1 | 1, cell: number, boxWidth: number, scale: number): number => {
  const left = building.x - building.width / 2;
  const gap = bladeGapFor(cell);
  return side > 0 ? left + building.width + gap * scale : left - (gap + boxWidth) * scale;
};

/** First pool entry, starting from a random offset, that satisfies `fits`. */
const pickText = (pool: readonly string[], rand: () => number, fits: (text: string) => boolean): null | string => {
  const start = Math.floor(rand() * pool.length);

  for (let i = 0; i < pool.length; i++) {
    const text = pool[(start + i) % pool.length];
    if (text && text.length <= MAX_TEXT_CHARS && fits(text)) {
      return text;
    }
  }

  return null;
};

/** Smallest character cell a frame sign shrinks to when its column would otherwise reach the building's foot. */
const FRAME_MIN_CELL = 12;

/**
 * The authored blade signs on one frame building: `FRAME_SIGNS` slots for its side, top to bottom, on the
 * inner edge. Cell sizes and spacing come from the building's own sign stream; if the column would reach the
 * foot, every cell shrinks a step at a time until it fits, so the authored texts are always placed.
 */
const placeFrameSigns = (layer: CityLayer, building: Building, signSeed: number): void => {
  const { scale } = layer;
  const rand = signStream(building, layer.index, signSeed);
  const { frame } = SIGNAGE;
  // the left frame building sits at negative x and shows its right side
  const side: -1 | 1 = building.x < 0 ? 1 : -1;
  const prefix = building.x < 0 ? "left" : "right";
  const records = [0, 1, 2].flatMap((n) => FRAME_SIGNS.filter((entry) => entry.slot === `${prefix}-${n}`));

  if (records.length === 0) {
    return;
  }

  const first = frame.top.min + frame.top.extra * rand();
  let cells = records.map(() => frame.cell.min + Math.round(frame.cell.extra * rand()));
  const gaps = records.slice(1).map(() => frame.gap.min + frame.gap.extra * rand());
  const available = building.height / scale - frame.bottomMargin - first;
  const columnHeight = (sizes: number[]): number =>
    sizes.reduce((sum, cell, i) => sum + signBox(cell, records[i]?.text.length ?? 0, true).height, 0) +
    gaps.reduce((sum, gap) => sum + gap, 0);

  while (columnHeight(cells) > available && Math.max(...cells) > FRAME_MIN_CELL) {
    cells = cells.map((cell) => Math.max(FRAME_MIN_CELL, cell - 1));
  }

  let yFromTop = first * scale;

  records.forEach((record, n) => {
    const cell = cells[n] ?? FRAME_MIN_CELL;
    const box = signBox(cell, record.text.length, true);
    const sign = makeSign(
      building,
      {
        cell,
        framed: true,
        href: record.href,
        id: record.id,
        mount: "blade",
        text: record.text,
        vertical: true,
        x: bladeX(building, side, cell, box.width, scale),
        yFromTop,
      },
      scale,
      rand,
    );
    layer.signs.push(sign);
    layer.details.push(...bracketsFor(building, sign, side, scale));
    yFromTop += (box.height + (gaps[n] ?? 0)) * scale;
  });
};

/**
 * Keeps the frame signs clear before they are placed: a strip inside the frame's inner edge wide enough for
 * the widest possible blade sign, its gap and breathing room, full height. Front buildings reaching into it
 * are narrowed to its edge, or dropped when too little would remain. Independent of the sign seed, so
 * reseeding signs never changes the skeleton. Runs before roof furniture is generated, so nothing floats.
 */
const reserveFrameStrip = (layer: CityLayer, frame: Building): void => {
  const { scale } = layer;
  const { frame: frameKnobs } = SIGNAGE;
  const widest = signBox(frameKnobs.cell.min + frameKnobs.cell.extra, 1, true).width;
  const stripWidth = (SIGNAGE.bladeGap.max + widest + SIGNAGE.breathing) * scale;
  const keep = SIGNAGE.trimKeep * layer.config.minW * scale;
  const side: -1 | 1 = frame.x < 0 ? 1 : -1;
  const edge = frame.x + (side * frame.width) / 2;
  const far = edge + side * stripWidth;
  const strip: Rect = { bottom: 0, left: Math.min(edge, far), right: Math.max(edge, far), top: Infinity };

  layer.buildings = layer.buildings.filter((building) => {
    if (building.frame || building.z !== 0) {
      return true;
    }

    const rect = buildingRect(building);

    if (!intersects(rect, strip)) {
      return true;
    }

    const left = side > 0 ? Math.max(rect.left, far) : rect.left;
    const right = side > 0 ? rect.right : Math.min(rect.right, far);

    if (right - left < keep) {
      return false;
    }

    building.width = right - left;
    building.x = (left + right) / 2;
    return true;
  });
};

/**
 * One rolled sign per front building, from the building's own stream. Horizontal signs sit flat on the
 * facade (the building gets a window-free band behind them) and always fit. Blade signs hang beside an
 * edge on brackets and are placed only where nothing in the front plane comes within `breathing` of them:
 * rolled side first, then the other, then a facade sign if a word spans the building, otherwise no sign.
 */
const placeDecorativeSign = (
  layer: CityLayer,
  building: Building,
  id: string,
  obstacles: Rect[],
  rand: () => number,
): void => {
  const { config, index, scale, skylineHeight } = layer;
  const nearest = index === NEAREST_LAYER;
  const middle = index <= NEAREST_LAYER - 2;
  const tall = building.height > skylineHeight * config.top * 0.66;
  const { chance } = SIGNAGE;
  const odds =
    index === 0
      ? 0
      : middle
        ? tall
          ? chance.middleTall
          : chance.middleShort
        : nearest
          ? chance.nearest
          : chance.other;

  if (rand() >= odds) {
    return;
  }

  const [, , cellH, gapY] = config.win;
  const rowPitch = (cellH + gapY) * scale;
  const widthRef = building.width / scale;
  const left = building.x - building.width / 2;
  const baseCell = SIGNAGE.cellByLayer[index] ?? 0;
  const cell = nearest ? baseCell + Math.round(SIGNAGE.cellJitter * rand()) : baseCell;
  const top = 8 * scale;
  const bottomLimit = building.height - (nearest ? 72 : 14) * scale;
  const breathing = SIGNAGE.breathing * scale;

  const fitsFacade = (text: string): boolean => {
    const box = signBox(cell, text.length, false);
    return box.width <= widthRef - 8 && box.width >= 0.55 * widthRef && box.height * scale <= bottomLimit - top;
  };
  const fitsBlade = (text: string): boolean => signBox(cell, text.length, true).height * scale <= bottomLimit - top;

  // a random height below the roof, snapped to the window rows
  const snapY = (boxH: number): number => {
    const room = bottomLimit - top - boxH;
    const topMargin = (3 + index + 2) * scale;
    const raw = top + rand() * (middle ? Math.min(room, building.height * 0.16) : 0.6 * room);
    const snapped = topMargin + Math.round((raw - topMargin) / rowPitch) * rowPitch - Math.min(2, gapY / 2) * scale;
    return Math.max(top, Math.min(top + room, snapped));
  };

  const facade = (text: string): void => {
    const box = signBox(cell, text.length, false);
    const boxH = box.height * scale;
    const yFromTop = snapY(boxH);
    const x = left + (building.width - box.width * scale) / 2;
    const sign = makeSign(
      building,
      { cell, framed: false, id, mount: "facade", text, vertical: false, x, yFromTop },
      scale,
      rand,
    );
    layer.signs.push(sign);
    obstacles.push(signRect(sign));
    // no windows on the floors behind the sign
    building.blank = [yFromTop - 2 * scale, yFromTop + boxH + 2 * scale];
  };

  const blade = (text: string): boolean => {
    const box = signBox(cell, text.length, true);
    const yFromTop = snapY(box.height * scale);
    const first: -1 | 1 = rand() < 0.5 ? -1 : 1;

    const sides: readonly (-1 | 1)[] = first > 0 ? [1, -1] : [-1, 1];

    for (const side of sides) {
      const sign = makeSign(
        building,
        {
          cell,
          framed: false,
          id,
          mount: "blade",
          text,
          vertical: true,
          x: bladeX(building, side, cell, box.width, scale),
          yFromTop,
        },
        scale,
        rand,
      );
      const edge = building.x + (side * building.width) / 2;
      // the strip from the building edge (brackets included) to the sign's far edge, with breathing room
      const zone: Rect = {
        bottom: sign.y - breathing,
        left: side > 0 ? edge : sign.x - breathing,
        right: side > 0 ? sign.x + sign.width + breathing : edge,
        top: sign.y + sign.height + breathing,
      };

      if (obstacles.some((obstacle) => intersects(obstacle, zone))) {
        continue;
      }

      layer.signs.push(sign);
      layer.details.push(...bracketsFor(building, sign, side, scale));
      obstacles.push(signRect(sign));
      return true;
    }

    return false;
  };

  const horizontalFirst = rand() < SIGNAGE.horizontalChance;
  const facadeText = horizontalFirst ? pickText(SIGN_POOL, rand, fitsFacade) : null;

  if (facadeText) {
    facade(facadeText);
    return;
  }

  const bladeText = pickText(SIGN_POOL, rand, fitsBlade);

  if (bladeText && blade(bladeText)) {
    return;
  }

  if (!horizontalFirst) {
    const fallback = pickText(SIGN_POOL, rand, fitsFacade);
    if (fallback) {
      facade(fallback);
    }
  }
};

/** Rolled signs for a layer's front row, left to right; `reserved` (the beacon building) gets none. */
const placeDecorativeSigns = (layer: CityLayer, signSeed: number, reserved: Building | null): void => {
  const obstacles = frontObstacles(layer);
  const front = layer.buildings.filter((building) => building.z === 0 && !building.frame).sort((a, b) => a.x - b.x);
  const seen = new Map<number, number>();

  for (const building of front) {
    if (building === reserved) {
      continue;
    }
    // ids come from the building seed; a repeated seed in the layer (rare) gets a suffix
    const repeat = seen.get(building.seed) ?? 0;
    seen.set(building.seed, repeat + 1);
    const id = repeat ? `${layer.index}:${building.seed}:${repeat}` : `${layer.index}:${building.seed}`;
    placeDecorativeSign(layer, building, id, obstacles, signStream(building, layer.index, signSeed));
  }
};

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
    z: building.z,
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
      out.beacons.push({ phase: r3 * Math.PI * 2, x: mastX, y: top + mastH, z: building.z });
    }
  } else if (roof < 0.64 && index >= 2) {
    // billboard on two posts; the posts stand in the board's plane at the facade so they show against the sky
    const boardW = width * (BILLBOARD.width.min + BILLBOARD.width.extra * r0);
    const boardH = BILLBOARD.heightRatio * boardW;
    const boardLeft = left + (width - boardW) / 2;
    const postH = (BILLBOARD.post.base + BILLBOARD.post.perLayer * index) * scale;
    const postW = 1.5 * scale;
    const boardZ = building.z + building.depth / 2 + 0.5 * scale;
    for (const fraction of [0.2, 0.8]) {
      out.details.push({
        ...box(boardLeft + fraction * boardW - postW / 2, top, postW, postH + 2 * scale),
        depth: postW,
        pattern: BRACKET_PATTERN,
        z: boardZ - postW / 2,
      });
    }
    out.billboards.push({
      colorSlot: Math.floor(r1 * 5),
      height: boardH,
      text: BILLBOARD_POOL[Math.floor(r3 * BILLBOARD_POOL.length)] ?? "",
      width: boardW,
      x: boardLeft + boardW / 2,
      y: top + postH + boardH / 2,
      z: boardZ,
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

/** A street gap in a layer, world x range. */
type Street = readonly [number, number];

const generateLayer = (config: LayerConfig, index: number, aspect: number, seed: number): CityLayer => {
  const rand = mulberry32(seed + 131 * index);
  const scale = depthScale(config.z);
  const skylineHeight = REF_VIEW_HEIGHT * SKYLINE_RATIO * scale;
  const span = visibleWidthAt(config.z, aspect) * WIDTH_MARGIN;
  // the walk covers a fixed aspect so the layout doesn't depend on the screen width; `cullLayer` trims it to `span`
  const walkSpan = visibleWidthAt(config.z, GENERATION_ASPECT) * WIDTH_MARGIN;
  const isNearest = index === NEAREST_LAYER;

  // depth budget: front faces stop short of the fog plane ahead, the back row short of the layer behind
  const gapFront = isNearest ? 0 : (LAYERS[index + 1]?.z ?? 0) - config.z;
  const gapBack = index > 0 ? config.z - (LAYERS[index - 1]?.z ?? 0) : FAR_LAYER_BACK_GAP;
  const frontLimit = isNearest ? NEAREST_FRONT_LIMIT : FRONT_LIMIT_RATIO * gapFront;
  const backLimit = BACK_LIMIT_RATIO * gapBack;

  const depthFor = (width: number, r: number, cap: number): number =>
    Math.max(1, Math.min(cap, width * DEPTH_FACTOR * config.side * (DEPTH_VARIATION.min + DEPTH_VARIATION.extra * r)));
  const widthFor = (): number => (config.minW + rand() * (config.maxW - config.minW)) * scale;
  const smallGap = (): number => (rand() < 0.35 ? rand() * (5 + 3 * index) * scale : 0);

  const front: Building[] = [];
  const streets: Street[] = [];

  let cursor = -walkSpan / 2 - rand() * config.minW * scale;
  let untilStreet = STREET_EVERY.min + Math.floor(rand() * STREET_EVERY.extra);

  while (cursor < walkSpan / 2) {
    const width = widthFor();
    const height = skylineHeight * config.top * (0.32 + 0.68 * Math.pow(rand(), 0.85));
    const patternRoll = rand();

    front.push({
      blank: null,
      depth: depthFor(width, rand(), 2 * frontLimit),
      frame: false,
      height,
      pattern: patternRoll < 0.62 ? 0 : patternRoll < 0.82 ? 1 : 2,
      rands: [rand(), rand(), rand(), rand()],
      roof: rand(),
      seed: Math.floor(rand() * 10000),
      width,
      x: cursor + width / 2,
      z: 0,
    });

    cursor += width;

    if (--untilStreet <= 0) {
      const street = streetWidth(index, rand()) * scale;
      streets.push([cursor, cursor + street]);
      cursor += street;
      untilStreet = STREET_EVERY.min + Math.floor(rand() * STREET_EVERY.extra);
    } else {
      cursor += smallGap();
    }
  }

  // Back row: lower boxes behind the front row's deepest face, skipping the streets so they run through.
  const frontBack = Math.max(0, ...front.map((building) => building.depth / 2));
  const backStart = frontBack + ALLEY * scale;
  const backSpace = backLimit - backStart;
  const back: Building[] = [];

  if (backSpace >= 3 * scale) {
    let backCursor = -walkSpan / 2 - rand() * config.minW * scale;
    let streetIndex = 0;

    while (backCursor < walkSpan / 2) {
      const width = widthFor();
      // jump past any street this box would overlap
      while (streetIndex < streets.length && (streets[streetIndex]?.[0] ?? Infinity) < backCursor + width) {
        const street = streets[streetIndex];
        if (street && street[1] > backCursor) {
          backCursor = street[1];
        }
        streetIndex++;
      }
      // back-row depth fills the space behind the front row rather than following the box width
      const depth = backSpace * (BACK_ROW_DEPTH.min + BACK_ROW_DEPTH.extra * rand());
      const patternRoll = rand();

      back.push({
        blank: null,
        depth,
        frame: false,
        height: skylineHeight * config.top * (BACK_ROW_HEIGHT.min + BACK_ROW_HEIGHT.extra * Math.pow(rand(), 0.85)),
        pattern: patternRoll < 0.62 ? 0 : patternRoll < 0.82 ? 1 : 2,
        rands: [rand(), rand(), rand(), rand()],
        roof: rand(),
        seed: Math.floor(rand() * 10000),
        width,
        x: backCursor + width / 2,
        z: -(backStart + depth / 2),
      });

      backCursor += width + smallGap();
    }
  }

  if (isNearest) {
    // Two full-height "frame" buildings at the viewport edges, mostly off-screen, matching the reference.
    const visible = visibleWidthAt(config.z, aspect);
    const frameWidth = (config.px + Math.max(70, Math.min(210, 0.11 * visible))) * scale;
    const frameHeight = skylineHeight + 60 * scale;

    for (const side of [-1, 1] as const) {
      const innerEdge = side * (visible / 2 - (frameWidth - config.px * scale));

      front.push({
        blank: null,
        depth: Math.max(1, Math.min(2 * frontLimit, frameWidth * DEPTH_FACTOR * config.side)),
        frame: true,
        height: frameHeight,
        pattern: 0,
        rands: [0.5, 0.5, 0.5, 0.5],
        roof: 1,
        seed: 7000 + (side + 1),
        width: frameWidth,
        x: innerEdge + (side * frameWidth) / 2,
        z: 0,
      });
    }
  }

  return {
    beacons: [],
    billboards: [],
    buildings: [...front, ...back],
    config,
    details: [],
    index,
    scale,
    signs: [],
    skylineHeight,
    span,
    z: config.z,
  };
};

/** Roof furniture for every building in the layer; after the frame zone is cleared so nothing floats. */
const furnish = (layer: CityLayer): void => {
  for (const building of layer.buildings) {
    const roof = generateRoof(building, layer.index, layer.scale, layer.config.side);
    layer.beacons.push(...roof.beacons);
    layer.billboards.push(...roof.billboards);
    layer.details.push(...roof.details);
  }
};

/** Drops everything generated beyond the layer's real span (the fixed-aspect walk overshoots narrower viewports). */
const cullLayer = (layer: CityLayer): CityLayer => {
  const half = layer.span / 2;
  const inside = (left: number, width: number): boolean => left + width > -half && left < half;

  return {
    ...layer,
    beacons: layer.beacons.filter((beacon) => inside(beacon.x, 0)),
    billboards: layer.billboards.filter((board) => inside(board.x - board.width / 2, board.width)),
    buildings: layer.buildings.filter((building) => inside(building.x - building.width / 2, building.width)),
    details: layer.details.filter((detail) => inside(detail.x - detail.width / 2, detail.width)),
    signs: layer.signs.filter((sign) => inside(sign.x, sign.width)),
  };
};

/**
 * Pure, deterministic city layout. The same seeds always yield the same city: layers are generated for
 * `GENERATION_ASPECT` and culled to the real aspect, so the screen width only decides how much of it shows.
 * Order: skeleton (city seed) → frame clear strips and authored frame signs → roof furniture → beacon
 * building → rolled signs (sign seed, per building) → cull.
 * No three.js imports here: the output is plain data that components turn into instanced attributes.
 */
export const generateCity = (aspect: number, seeds: Seeds = SEEDS): CityLayout => {
  const generated = LAYERS.map((config, index) => generateLayer(config, index, aspect, seeds.city));
  const nearest = generated[NEAREST_LAYER];

  if (nearest) {
    for (const frame of nearest.buildings.filter((building) => building.frame)) {
      reserveFrameStrip(nearest, frame);
      placeFrameSigns(nearest, frame, seeds.sign);
    }
  }

  for (const layer of generated) {
    furnish(layer);
  }

  const beacon = pickSearchlight(generated, aspect);

  for (const layer of generated) {
    placeDecorativeSigns(layer, seeds.sign, beacon?.building ?? null);
  }

  // one authored sign gets a permanently dead glyph; from the sign seed, so it holds while browsing city seeds
  const allSigns = generated.flatMap((layer) => layer.signs);
  const candidates = allSigns.filter((sign) => sign.framed);
  const pool = candidates.length ? candidates : allSigns;
  const victim = pool[Math.floor(mulberry32(seeds.sign + 99)() * pool.length)];

  if (victim) {
    victim.dead = Math.floor(mulberry32(seeds.sign + 7)() * victim.text.length);
  }

  // the street sits in front of whatever the nearest layer's deepest box (frame buildings included) reaches
  const deepestFront = nearest
    ? Math.max(0, ...nearest.buildings.map((building) => building.z + building.depth / 2))
    : 0;
  const stallZ = deepestFront + STALL.clearance;

  return {
    groundY: GROUND_Y,
    layers: generated.map(cullLayer),
    searchlight: beacon?.searchlight ?? null,
    shoreZ: stallZ + STALL.pavementDepth,
    stallZ,
  };
};

/** The searchlight's building (tallest front-row building in the central 40% of the second-nearest layer) and its placement. */
const pickSearchlight = (
  layers: CityLayer[],
  aspect: number,
): null | { building: Building; searchlight: Searchlight } => {
  const layer = layers[NEAREST_LAYER - 1];

  if (!layer) {
    return null;
  }

  const limit = 0.2 * visibleWidthAt(layer.z, aspect);
  let best: Building | null = null;

  for (const building of layer.buildings) {
    if (building.frame || building.z !== 0 || Math.abs(building.x) > limit) {
      continue;
    }
    if (!best || building.height > best.height) {
      best = building;
    }
  }

  if (!best) {
    return null;
  }

  // reference: radius = clamp(3% of the viewport width, 26, 56) screen px
  const radius = Math.max(26, Math.min(56, 0.03 * aspect * REF_VIEW_HEIGHT)) * layer.scale;

  return {
    building: best,
    searchlight: { radius, roofY: best.height, x: best.x, z: layer.z + best.z + best.depth / 2 },
  };
};
