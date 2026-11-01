import type { Seeds } from "./config";
import { SEEDS } from "./config";

/** Which query values were given as text, for the debug overlay; the hashed integers are what the city uses. */
export type SeedLabels = { city?: string; sign?: string; stall?: string };

export type SeedOverrides = { seedLabels: SeedLabels; seeds: Seeds };

/**
 * A 32-bit hash of any text (FNV-1a with a final avalanche), so a word can be a seed: `?seed=rainy-tuesday`.
 * Always a safe non-negative integer, so it flows through `mulberry32` and the seed mixing like a number.
 */
export const hashSeed = (text: string): number => {
  let h = 0x811c9dc5;

  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }

  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;

  return h >>> 0;
};

/**
 * `?seed=<value>` overrides the city seed, `?signSeed=<value>` the sign seed and `?stallSeed=<value>` the stall
 * seed for this page load, so a layout can be browsed or pinned without editing `config.ts`. An integer is used as is (so numeric URLs keep their
 * cities); any other text is hashed with `hashSeed`; blank values are ignored. Browser only.
 */
export const readSeedOverrides = (): SeedOverrides => {
  const params = new URLSearchParams(window.location.search);
  const seedLabels: SeedLabels = {};

  const read = (key: keyof Seeds, param: string, fallback: number): number => {
    const value = params.get(param)?.trim() ?? "";

    if (value === "") {
      return fallback;
    }

    const parsed = Number(value);

    if (Number.isSafeInteger(parsed)) {
      return parsed;
    }

    seedLabels[key] = value;
    return hashSeed(value);
  };

  return {
    seedLabels,
    seeds: {
      city: read("city", "seed", SEEDS.city),
      sign: read("sign", "signSeed", SEEDS.sign),
      stall: read("stall", "stallSeed", SEEDS.stall),
    },
  };
};
