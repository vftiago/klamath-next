const SCENE_START_TIME = performance.now();
const TIME_SPEED = 1;
// wrapped hourly: unbounded time degrades float precision in the shaders during long-lived tabs
const TIME_WRAP_SECONDS = 3600;

export const getSceneTime = () => (((performance.now() - SCENE_START_TIME) / 1000) * TIME_SPEED) % TIME_WRAP_SECONDS;

/**
 * Deterministic 32-bit PRNG (mulberry32). Pure for a given seed, so it is safe to call during render
 * inside `useMemo` — unlike `Math.random`, which the hooks lint forbids in the render phase.
 */
export const mulberry32 = (seed: number): (() => number) => {
  let a = seed | 0;

  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
