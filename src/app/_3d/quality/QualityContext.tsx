"use client";

import { createContext, useContext } from "react";
import type { QualityKnobs, QualityTier } from "./tiers";
import { QUALITY_TIERS } from "./tiers";

export type Quality = QualityKnobs & { tier: QualityTier };

const QualityContext = createContext<Quality>({ ...QUALITY_TIERS.full, tier: "full" });

export const QualityProvider = QualityContext.Provider;

/** The current quality tier and its knobs. */
export const useQuality = (): Quality => useContext(QualityContext);

export const qualityFor = (tier: QualityTier): Quality => ({ ...QUALITY_TIERS[tier], tier });
