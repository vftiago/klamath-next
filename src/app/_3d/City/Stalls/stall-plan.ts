import { mulberry32 } from "../../utils";
import { STALL } from "../config";

export type Rgb = readonly [number, number, number];

export const AMBER: Rgb = [255, 176, 96];
export const LAVENDER: Rgb = [236, 228, 255];
export const INK: Rgb = [5, 1, 15];
export const WHITE: Rgb = [255, 255, 255];
const NEON: readonly Rgb[] = [
  [255, 45, 170],
  [40, 235, 255],
  [214, 255, 40],
  [255, 45, 170],
  [40, 235, 255],
];

export const lerp = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

export type Awning =
  { kind: "solid"; rise: number; sign: Rgb } | { kind: "stripes"; neon: Rgb; rise: number; stripes: number };

/**
 * Everything about one stall variant, in reference px, resolved up front so the painter (detail sprites)
 * and the geometry builder (boxes, bulbs) agree. Pure and seeded.
 */
export type StallPlan = {
  awning: Awning;
  /** Roof line above the ground. */
  bodyHeight: number;
  bulbs: number;
  counterHeight: number;
  curtain: { color: Rgb; height: number; panels: number };
  /** Footprint depth, back posts to counter front. */
  depth: number;
  glow: "amber" | "lavender";
  lanterns: boolean;
  /** Patron x positions from the stall's left edge. */
  patrons: number[];
  width: number;
};

export const glowColor = (plan: StallPlan): Rgb => (plan.glow === "amber" ? AMBER : LAVENDER);

const planStall = (rand: () => number, width: number, bodyHeight: number, counterHeight: number): StallPlan => {
  const glow = rand() < 0.75 ? "amber" : "lavender";
  const curtainRoll = rand();
  const curtain = {
    color: (curtainRoll < 0.55 ? [36, 34, 96] : curtainRoll < 0.6 ? [150, 26, 40] : [24, 20, 30]) as Rgb,
    height: (bodyHeight - counterHeight) * (0.38 + 0.12 * rand()),
    panels: 3 + Math.floor(2 * rand()),
  };
  const patronCount = Math.floor(3 * rand());
  const patrons = Array.from(
    { length: patronCount },
    (_, k) => width * (0.25 + (k / Math.max(1, patronCount)) * 0.55) + (rand() - 0.5) * 6,
  );
  const rise = 9 + 4 * rand();
  const awning: Awning =
    rand() < 0.55
      ? {
          kind: "stripes",
          neon: NEON[Math.floor(rand() * NEON.length)] ?? AMBER,
          rise,
          stripes: Math.max(4, Math.round(width / 9)),
        }
      : {
          kind: "solid",
          rise,
          sign:
            rand() < 0.5 ? (glow === "amber" ? AMBER : LAVENDER) : (NEON[Math.floor(rand() * NEON.length)] ?? AMBER),
        };

  return {
    awning,
    bodyHeight,
    bulbs: Math.max(3, Math.round(width / 16)),
    counterHeight,
    curtain,
    depth: STALL.depth.min + STALL.depth.extra * rand(),
    glow,
    lanterns: rand() < STALL.lantern.chance,
    patrons,
    width,
  };
};

/** `count` stall variants for the seed; the same sequence the painted sheet used, so layouts are stable. */
export const planStalls = (count: number = STALL.variants, seed = 2027): StallPlan[] => {
  const rand = mulberry32(seed);

  return Array.from({ length: count }, (_, k) => {
    const bodyHeight = STALL.bodyHeight.min + STALL.bodyHeight.extra * rand();
    const counterHeight = STALL.counterHeight.min + STALL.counterHeight.extra * rand();
    const width = STALL.width.min + STALL.width.extra * rand();

    return planStall(mulberry32(seed + 17 * k + 1), width, bodyHeight, counterHeight);
  });
};
