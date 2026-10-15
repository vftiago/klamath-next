/**
 * Quality tiers for the city scene. Picked by `use-quality-tier` (phase 7); until then the scene runs FULL
 * on `md+` and REDUCED below, mirroring the existing DPR rule.
 */
export type QualityTier = "full" | "off" | "reduced" | "static";

export type QualityKnobs = {
  /** Enable the bloom pass in PostEffect (phase 4). */
  bloom: boolean;
  /** Maximum device pixel ratio for the canvas. */
  dprMax: number;
  /** Number of scrolling fog planes (phase 2). */
  fogPlanes: number;
  /** Render-target scale for the river reflection, 0 = skip the pass (phase 3). */
  reflectionScale: number;
  /** Instanced rain drops, 0 = rain unavailable (phase 6). */
  rainDrops: number;
  /** Run the neon sign state machine; false freezes signs at "ok" (phase 4). */
  signFlicker: boolean;
  /** Spawn stall smoke particles (phase 5). */
  smoke: boolean;
  /** Animate window toggling and other continuous motion. */
  windowToggle: boolean;
};

export const QUALITY_TIERS: Record<QualityTier, QualityKnobs> = {
  full: {
    bloom: true,
    dprMax: 2,
    fogPlanes: 3,
    rainDrops: 480,
    reflectionScale: 0.5,
    signFlicker: true,
    smoke: true,
    windowToggle: true,
  },
  off: {
    bloom: false,
    dprMax: 1,
    fogPlanes: 0,
    rainDrops: 0,
    reflectionScale: 0,
    signFlicker: false,
    smoke: false,
    windowToggle: false,
  },
  reduced: {
    bloom: false,
    dprMax: 1,
    fogPlanes: 2,
    rainDrops: 200,
    reflectionScale: 0.33,
    signFlicker: true,
    smoke: true,
    windowToggle: true,
  },
  static: {
    bloom: false,
    dprMax: 1,
    fogPlanes: 1,
    rainDrops: 0,
    reflectionScale: 0,
    signFlicker: false,
    smoke: false,
    windowToggle: false,
  },
};
