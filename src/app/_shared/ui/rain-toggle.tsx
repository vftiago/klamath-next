"use client";

import { clsx } from "clsx";
import { IoRainyOutline } from "react-icons/io5";
import { setRainEnabled, useRainPreference } from "@/app/_3d/Rain/use-rain-preference";
import { usePrefersReducedMotion } from "@/app/_shared/utils/use-prefers-reduced-motion";

/**
 * Rain on/off switch for the city scene. Persists per browser; hidden under reduced motion, where the
 * scene itself isn't rendered.
 */
const RainToggle = () => {
  const enabled = useRainPreference();
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <button
      aria-pressed={enabled}
      className={clsx(
        "fixed top-4 right-4 z-20 flex items-center gap-2 rounded-xl border border-white/20 bg-gray-500/10 px-3 py-2 font-mono text-xs tracking-[0.16em] uppercase transition-colors",
        enabled ? "text-white" : "text-white/50 hover:text-white/80",
      )}
      title={enabled ? "Turn the rain off" : "Turn the rain on"}
      type="button"
      onClick={() => setRainEnabled(!enabled)}
    >
      <IoRainyOutline aria-hidden="true" className="size-4" />
      <span>Rain</span>
      <span
        aria-hidden="true"
        className={clsx(
          "size-2 rounded-full transition-shadow",
          enabled
            ? "bg-cyan-300 shadow-[0_0_6px_1px_rgba(103,232,249,0.8),0_0_14px_3px_rgba(103,232,249,0.4)]"
            : "border border-white/20 bg-gray-700/50",
        )}
      />
    </button>
  );
};

export default RainToggle;
