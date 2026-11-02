/** A slow oscillation layered on the wind: adds `amplitude × sin(2πt / period)` to the slant, `period` in seconds. */
export type WindSway = {
  amplitude: number;
  period: number;
};

export type Wind = {
  /** Which way the drops travel as they fall. */
  direction: "left" | "right";
  /** Slant at rest: horizontal travel per unit fallen (0.3 ≈ 17° off vertical, 1 = 45°). */
  strength: number;
  /** Sways summed onto the strength, so the slant breathes instead of holding still. */
  sway: readonly WindSway[];
};

export type RainConfig = {
  /** Drops at full quality; lower tiers draw their `rainDensity` share of them. */
  drops: number;
  wind: Wind;
};

/** The reference rain: 480 drops in a light breeze to the right, swaying over 17 s and 6.3 s. */
export const DEFAULT_RAIN: RainConfig = {
  drops: 480,
  wind: {
    direction: "right",
    strength: 0.3,
    sway: [
      { amplitude: 0.06, period: 17 },
      { amplitude: 0.02, period: 6.3 },
    ],
  },
};

/** The rain in use: `DEFAULT_RAIN` with tuning overrides. A denser downpour driven hard to the left. */
export const RAIN: RainConfig = {
  ...DEFAULT_RAIN,
  drops: 1080,
  wind: { ...DEFAULT_RAIN.wind, direction: "left", strength: 1 },
};

/** The wind's slant at time `t` (seconds), signed: positive drifts right as the drops fall. */
export const windSlope = ({ direction, strength, sway }: Wind, t: number): number =>
  (direction === "left" ? -1 : 1) *
  sway.reduce((slope, { amplitude, period }) => slope + amplitude * Math.sin((t * Math.PI * 2) / period), strength);
