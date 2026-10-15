/**
 * Quality tiers for the city scene. `useQualityTier` picks one from the breakpoint and reduced-motion
 * state, then a frame-time probe may step it down; components read the knobs through `useQuality`.
 */
export type QualityTier = "full" | "off" | "reduced" | "static";

export type QualityKnobs = {
  /** Continuous animation: window toggling, beacon blinks, badge bob/flicker. */
  animate: boolean;
  /** Frame-time budget in ms the probe holds this tier to; above it the scene steps down one tier. */
  budgetMs: number;
  /** Maximum device pixel ratio for the canvas. */
  dprMax: number;
  /** Number of scrolling fog planes, nearest layers first. */
  fogPlanes: number;
  /** Instanced rain drops, 0 = rain unavailable regardless of the toggle. */
  rainDrops: number;
  /** Render-target scale for the river reflection, 0 = skip the pass (flat tinted water). */
  reflectionScale: number;
  /** Render only on demand (camera moves, scroll) instead of every frame. */
  renderOnDemand: boolean;
  /** Run the neon sign state machine; false holds signs steady. */
  signFlicker: boolean;
  /** Spawn stall smoke particles. */
  smoke: boolean;
};

export const QUALITY_TIERS: Record<QualityTier, QualityKnobs> = {
  full: {
    animate: true,
    budgetMs: 18,
    dprMax: 2,
    fogPlanes: 5,
    rainDrops: 480,
    reflectionScale: 0.5,
    renderOnDemand: false,
    signFlicker: true,
    smoke: true,
  },
  off: {
    animate: false,
    budgetMs: Infinity,
    dprMax: 1,
    fogPlanes: 0,
    rainDrops: 0,
    reflectionScale: 0,
    renderOnDemand: true,
    signFlicker: false,
    smoke: false,
  },
  reduced: {
    animate: true,
    budgetMs: 22,
    dprMax: 1,
    fogPlanes: 3,
    rainDrops: 200,
    reflectionScale: 0.33,
    renderOnDemand: false,
    signFlicker: true,
    smoke: true,
  },
  static: {
    animate: false,
    budgetMs: Infinity,
    dprMax: 1,
    fogPlanes: 1,
    rainDrops: 0,
    reflectionScale: 0,
    renderOnDemand: true,
    signFlicker: false,
    smoke: false,
  },
};

/** The tier below a given one; `static` is the floor for a visible scene. */
export const STEP_DOWN: Record<QualityTier, QualityTier> = {
  full: "reduced",
  off: "off",
  reduced: "static",
  static: "static",
};
