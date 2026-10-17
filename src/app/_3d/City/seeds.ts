import type { Seeds } from "./config";
import { SEEDS } from "./config";

/**
 * `?seed=<n>` overrides the city seed and `?signSeed=<n>` the sign seed for this page load, so a layout can be
 * browsed or pinned without editing `config.ts`. Anything that isn't an integer is ignored. Browser only.
 */
export const readSeedOverrides = (): Seeds => {
  const params = new URLSearchParams(window.location.search);

  const read = (key: string, fallback: number): number => {
    const value = params.get(key);
    const parsed = value === null || value.trim() === "" ? NaN : Number(value);
    return Number.isSafeInteger(parsed) ? parsed : fallback;
  };

  return { city: read("seed", SEEDS.city), sign: read("signSeed", SEEDS.sign) };
};
