import { useEffect, useState } from "react";
import type { QualityTier } from "./tiers";
import { QUALITY_TIERS, STEP_DOWN } from "./tiers";

const STORAGE_KEY = "klamath:quality";
/** Frames are ignored for this long after (re)starting a probe, so shader compiles don't count. */
const WARM_UP_MS = 1500;
/** Length of the measuring window. */
const WINDOW_MS = 2000;
/** The probe uses this percentile of frame times, which ignores the odd GC spike but not sustained slowness. */
const PERCENTILE = 0.75;

type Options = {
  /** Starting tier before any measurement. */
  initial: QualityTier;
  /** Set to force a tier and skip probing (e.g. `?quality=static`). */
  forced?: null | QualityTier;
};

const isTier = (value: null | string): value is QualityTier => value !== null && value in QUALITY_TIERS;

type Stored = { tier: QualityTier; verified: boolean };

/** The session remembers the tier and whether a probe has confirmed it holds its budget. */
const readStored = (): null | Stored => {
  try {
    const [first, flag] = (sessionStorage.getItem(STORAGE_KEY) ?? "").split(":");
    const tier = first ?? null;
    return isTier(tier) ? { tier, verified: flag === "ok" } : null;
  } catch {
    return null;
  }
};

const store = (tier: QualityTier, verified: boolean) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, `${tier}:${verified ? "ok" : "pending"}`);
  } catch {
    // session storage unavailable: the tier still holds for this page
  }
};

/**
 * Picks the quality tier. Starts from `initial` (or the session's remembered tier), then measures frame
 * times with requestAnimationFrame: after a warm-up, if the 75th-percentile frame time over a 2 s window
 * exceeds the tier's budget, the scene steps down one tier and probes that one too, until a tier holds.
 * It never steps up; a verified tier is remembered for the session so route changes don't re-probe.
 */
export const useQualityTier = ({ forced = null, initial }: Options): QualityTier => {
  const [tier, setTier] = useState<QualityTier>(() => forced ?? readStored()?.tier ?? initial);

  useEffect(() => {
    const budget = QUALITY_TIERS[tier].budgetMs;
    const stored = readStored();

    if (forced || (stored?.tier === tier && stored.verified)) {
      return;
    }

    if (!Number.isFinite(budget)) {
      store(tier, true);
      return;
    }

    let handle = 0;
    let last = -1;
    const start = performance.now();
    const samples: number[] = [];

    const tick = (now: number) => {
      if (last >= 0 && now - start > WARM_UP_MS) {
        samples.push(now - last);
      }
      last = now;

      if (now - start < WARM_UP_MS + WINDOW_MS) {
        handle = requestAnimationFrame(tick);
        return;
      }

      samples.sort((a, b) => a - b);
      const p75 = samples[Math.min(samples.length - 1, Math.floor(samples.length * PERCENTILE))] ?? 0;

      if (p75 > budget) {
        const next = STEP_DOWN[tier];
        store(next, false);
        setTier(next);
      } else {
        store(tier, true);
      }
    };

    handle = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(handle);
  }, [forced, tier]);

  return forced ?? tier;
};

/** `?quality=<tier>` forces a tier for testing; anything else is ignored. */
export const readForcedTier = (): null | QualityTier => {
  const value = new URLSearchParams(window.location.search).get("quality");
  return isTier(value) ? value : null;
};
