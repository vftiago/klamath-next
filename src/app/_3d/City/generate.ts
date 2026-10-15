import { mulberry32 } from "../utils";
import type { LayerConfig } from "./config";
import {
  depthScale,
  GROUND_Y,
  LAYERS,
  NEAREST_LAYER,
  PAVEMENT_DEPTH,
  REF_VIEW_HEIGHT,
  SEED,
  SKYLINE_RATIO,
  STALL_CLEARANCE,
  visibleWidthAt,
  WIDTH_MARGIN,
} from "./config";
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
  /** Generated width of the layer (visible width plus margin), world units. */
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

/** Side-face depth that projects to the reference's fake trapezoid width: ~0.68 * side * width. */
const DEPTH_FACTOR = 0.68;

type RoofFurniture = Pick<CityLayer, "beacons" | "billboards" | "details">;

/** Character cell size per layer, reference px; the nearest layer adds up to 6 px of variation. */
const SIGN_CELL_BY_LAYER = [0, 7, 9, 10, 11, 18];
/** Sign brightness per layer. */
export const SIGN_DIM_BY_LAYER = [0.4, 0.6, 0.72, 0.82, 0.9, 1];
const GLYPH_PITCH = 1.18;
/** Blade signs hang this far (reference px) from the building edge; two short poles bridge the gap. */
const BLADE_GAP = 6;
const BRACKET_THICKNESS = 2;
/** Distance from the sign's top/bottom edge to each pole, reference px. */
const BRACKET_INSET = 8;
/** Window pattern value for bracket boxes: drawn plain in a lighter metal tone. */
export const BRACKET_PATTERN = 4;

const signBox = (cell: number, count: number, vertical: boolean) => {
  const margin = Math.max(3, Math.round(0.3 * cell));
  const run = count * GLYPH_PITCH * cell + 2 * margin;
  const across = cell + 2 * margin;
  return { height: vertical ? run : across, margin, width: vertical ? across : run };
};

type SignPlacement = {
  cell: number;
  framed: boolean;
  mount: SignMount;
  text: string;
  vertical: boolean;
  /** Box left edge, world x. */
  x: number;
  /** Box top, measured down from the building's roof, in world units. */
  yFromTop: number;
};

const makeSign = (building: Building, placement: SignPlacement, scale: number, rand: () => number): Sign => {
  const { cell, framed, mount, text, vertical, x, yFromTop } = placement;
  const box = signBox(cell, text.length, vertical);

  return {
    cell: cell * scale,
    colorSlot: Math.floor(rand() * 5),
    dead: -1,
    flaky: rand() < 0.55,
    framed,
    height: box.height * scale,
    margin: box.margin * scale,
    mount,
    phase: rand() * Math.PI * 2,
    text,
    vertical,
    width: box.width * scale,
    x,
    y: building.height - (yFromTop + box.height * scale),
    z: building.depth / 2 + 0.5 * scale,
  };
};

/**
 * Two short poles tying a blade sign to the facade it hangs beside: thin rods at the facade plane that
 * bridge the gap from the building edge into the sign box, like a real wall-mounted blade sign.
 */
const bracketsFor = (building: Building, sign: Sign, side: -1 | 1, scale: number): PlainBox[] => {
  const edge = building.x + (side * building.width) / 2;
  const length = (BLADE_GAP + 2) * scale;
  const thickness = BRACKET_THICKNESS * scale;
  // the poles sit a little in from the sign's top and bottom edges
  const inset = BRACKET_INSET * scale;
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

type SignResult = { brackets: PlainBox[]; signs: Sign[] };

/**
 * Sign placement. Vertical signs are blade signs hung beside a building edge on brackets (frame buildings:
 * the inner edge, up to three, texts from `FRAME_SIGNS`). Horizontal signs sit flat on the facade and the
 * building gets a window-free band behind them. Per-layer odds follow the reference.
 */
const generateSigns = (
  building: Building,
  index: number,
  layerConfig: LayerConfig,
  scale: number,
  skylineHeight: number,
  rand: () => number,
): SignResult => {
  const nearest = index === NEAREST_LAYER;
  const middle = index <= NEAREST_LAYER - 2;
  const [, , cellH, gapY] = layerConfig.win;
  const rowPitch = (cellH + gapY) * scale;
  const widthRef = building.width / scale;
  const left = building.x - building.width / 2;
  const result: SignResult = { brackets: [], signs: [] };

  if (building.frame) {
    // inner edge: the left frame building sits at negative x and shows its right side
    const side: -1 | 1 = building.x < 0 ? 1 : -1;
    const slotBase = building.x < 0 ? 0 : 3;
    let yFromTop = (90 + 30 * rand()) * scale;
    const limit = building.height - 90 * scale;

    for (let n = 0; n < 3; n++) {
      const cell = 22 + Math.round(6 * rand());
      const fits = (text: string) => yFromTop + signBox(cell, text.length, true).height * scale <= limit;
      const preset = FRAME_SIGNS[slotBase + n];
      const text = preset && fits(preset) ? preset : pickText(SIGN_POOL, rand, fits);

      if (!text) {
        break;
      }

      const box = signBox(cell, text.length, true);
      const x = side > 0 ? left + building.width + BLADE_GAP * scale : left - (BLADE_GAP + box.width) * scale;
      const sign = makeSign(
        building,
        { cell, framed: true, mount: "blade", text, vertical: true, x, yFromTop },
        scale,
        rand,
      );
      result.signs.push(sign);
      result.brackets.push(...bracketsFor(building, sign, side, scale));
      yFromTop += (box.height + 10 + 16 * rand()) * scale;
    }

    return result;
  }

  const tall = building.height > skylineHeight * layerConfig.top * 0.66;
  const chance = index === 0 ? 0 : middle ? (tall ? 0.5 : 0.03) : nearest ? 0.28 : 0.2;

  if (rand() >= chance) {
    return result;
  }

  const cell = nearest ? SIGN_CELL_BY_LAYER[index] + Math.round(6 * rand()) : SIGN_CELL_BY_LAYER[index];
  const top = 8 * scale;
  const bottomLimit = building.height - (nearest ? 72 : 14) * scale;
  const horizontalRoll = rand() < 0.4;

  // horizontal on the facade when a word spans 55-100% of it and the roll allows; otherwise a blade sign
  const horizontalText = horizontalRoll
    ? pickText(SIGN_POOL, rand, (text) => {
        const box = signBox(cell, text.length, false);
        return box.width <= widthRef - 8 && box.width >= 0.55 * widthRef && box.height * scale <= bottomLimit - top;
      })
    : null;
  const vertical = horizontalText === null;
  const text =
    horizontalText ??
    pickText(SIGN_POOL, rand, (t) => signBox(cell, t.length, true).height * scale <= bottomLimit - top);

  if (!text) {
    return result;
  }

  const box = signBox(cell, text.length, vertical);
  const boxH = box.height * scale;
  const room = bottomLimit - top - boxH;
  const topMargin = (3 + index + 2) * scale;
  let yFromTop = top + rand() * (middle ? Math.min(room, building.height * 0.16) : 0.6 * room);
  yFromTop = Math.max(
    top,
    Math.min(
      top + room,
      topMargin + Math.round((yFromTop - topMargin) / rowPitch) * rowPitch - Math.min(2, gapY / 2) * scale,
    ),
  );

  if (vertical) {
    const side: -1 | 1 = rand() < 0.5 ? -1 : 1;
    const x = side > 0 ? left + building.width + BLADE_GAP * scale : left - (BLADE_GAP + box.width) * scale;
    const sign = makeSign(
      building,
      { cell, framed: false, mount: "blade", text, vertical: true, x, yFromTop },
      scale,
      rand,
    );
    result.signs.push(sign);
    result.brackets.push(...bracketsFor(building, sign, side, scale));
    return result;
  }

  const x = left + (building.width - box.width * scale) / 2;
  result.signs.push(
    makeSign(building, { cell, framed: false, mount: "facade", text, vertical: false, x, yFromTop }, scale, rand),
  );
  // no windows on the floors behind the sign
  building.blank = [yFromTop - 2 * scale, yFromTop + boxH + 2 * scale];

  return result;
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
      text: BILLBOARD_POOL[Math.floor(r3 * BILLBOARD_POOL.length)] ?? "",
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
      blank: null,
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
        blank: null,
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
  const signs: Sign[] = [];

  for (const building of buildings) {
    const roof = generateRoof(building, index, scale, config.side);
    furniture.beacons.push(...roof.beacons);
    furniture.billboards.push(...roof.billboards);
    furniture.details.push(...roof.details);
    const placed = generateSigns(building, index, config, scale, skylineHeight, rand);
    signs.push(...placed.signs);
    furniture.details.push(...placed.brackets);
  }

  return { ...furniture, buildings, config, index, scale, signs, skylineHeight, span, z: config.z };
};

/**
 * Pure, deterministic city layout. Same seed and aspect always yield the same city.
 * No three.js imports here: the output is plain data that components turn into instanced attributes.
 */
export const generateCity = (aspect: number, seed: number = SEED): CityLayout => {
  const layers = LAYERS.map((config, index) => generateLayer(config, index, aspect, seed));

  // one sign, preferably a framed one, gets a permanently dead glyph
  const allSigns = layers.flatMap((layer) => layer.signs);
  const candidates = allSigns.filter((sign) => sign.framed);
  const pool = candidates.length ? candidates : allSigns;
  const victim = pool[Math.floor(mulberry32(99)() * pool.length)];

  if (victim) {
    victim.dead = Math.floor(mulberry32(7)() * victim.text.length);
  }

  // the street sits in front of whatever the nearest layer's deepest box (frame buildings included) reaches
  const nearest = layers[NEAREST_LAYER];
  const deepestFront = nearest ? Math.max(0, ...nearest.buildings.map((building) => building.depth / 2)) : 0;
  const stallZ = deepestFront + STALL_CLEARANCE;

  return {
    groundY: GROUND_Y,
    layers,
    searchlight: pickSearchlight(layers, aspect),
    shoreZ: stallZ + PAVEMENT_DEPTH,
    stallZ,
  };
};

const pickSearchlight = (layers: CityLayer[], aspect: number): null | Searchlight => {
  const layer = layers[NEAREST_LAYER - 1];

  if (!layer) {
    return null;
  }

  // candidates: non-frame buildings within the central 40% of the visible width at this depth
  const limit = 0.2 * visibleWidthAt(layer.z, aspect);
  let best: Building | null = null;

  for (const building of layer.buildings) {
    if (building.frame || Math.abs(building.x) > limit) {
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

  return { radius, roofY: best.height, x: best.x, z: layer.z + best.depth / 2 };
};
