import { REF_VIEW_HEIGHT } from "../City/config";

/**
 * Where and how often rain drops land, worked out from the fall model in `rain.vert` so the ripples can follow
 * the rain statistically. KEEP IN SYNC with `rain.vert`: the speed ramp, the fall distance and the depth range.
 *
 * Every drop falls on a loop. With `u` its depth seed (0 far, 1 near), it falls `(FALL_BASE + FALL_RAMP·u)·s`
 * per second over `FALL_CYCLE·s`, where `s` is its depth scale, so the `s` cancels: a drop lands
 * `(FALL_BASE + FALL_RAMP·u) / FALL_CYCLE` times per second at any depth (0.68/s far, 2.2/s near).
 */

/** World depths drops fall between (far, near): from among the mid layers to just in front of the camera. */
export const DROP_DEPTH = { far: -450, near: 940 } as const;

/** Fall speed in reference px per second at depth seed `u`: `FALL_BASE + FALL_RAMP·u`. */
const FALL_BASE = 700;
const FALL_RAMP = 1600;

/** Fall distance in reference px, the drop's top to the water: 1.15 view heights plus a 60 px lead-in. */
const FALL_CYCLE = 1.15 * REF_VIEW_HEIGHT + 60;

/** Ripples start this far past the shoreline, so no ring lands on the pavement's edge. */
const SHORE_MARGIN = 10;

/** The depth seeds whose drops fall on the water: from the shoreline (plus margin) to the nearest drop. */
const waterSeeds = (shoreZ: number): number => {
  const start = (shoreZ + SHORE_MARGIN - DROP_DEPTH.far) / (DROP_DEPTH.near - DROP_DEPTH.far);
  return Math.min(1, Math.max(0, start));
};

/** Drops landing on the water per second, for `drops` falling drops: the landing rate integrated over the water seeds. */
export const waterLandingRate = (drops: number, shoreZ: number): number => {
  const u0 = waterSeeds(shoreZ);
  return (drops * (FALL_BASE * (1 - u0) + (FALL_RAMP / 2) * (1 - u0 * u0))) / FALL_CYCLE;
};

/**
 * World z of one landing on the water, from a uniform roll `r` in [0, 1). Landings aren't spread evenly: a
 * drop's landing rate grows linearly with its depth seed, so near water sees more of them. This inverts that
 * linear density's CDF over the water seeds.
 */
export const landingZ = (r: number, shoreZ: number): number => {
  const u0 = waterSeeds(shoreZ);
  const total = FALL_BASE * (1 - u0) + (FALL_RAMP / 2) * (1 - u0 * u0);
  const lead = FALL_BASE + FALL_RAMP * u0;
  const u = (Math.sqrt(lead * lead + 2 * FALL_RAMP * r * total) - FALL_BASE) / FALL_RAMP;
  return DROP_DEPTH.far + (DROP_DEPTH.near - DROP_DEPTH.far) * u;
};

/** World z span of the water drops land on: the shoreline (plus margin) to the nearest drop. */
export const waterSpan = (shoreZ: number): { far: number; near: number } => ({
  far: shoreZ + SHORE_MARGIN,
  near: DROP_DEPTH.near,
});
