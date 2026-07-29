import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const getSnapshot = (): boolean => window.matchMedia(QUERY).matches;

const getServerSnapshot = (): boolean => false;

const subscribe = (callback: () => void) => {
  const mediaQuery = window.matchMedia(QUERY);

  mediaQuery.addEventListener("change", callback);

  return () => mediaQuery.removeEventListener("change", callback);
};

export const usePrefersReducedMotion = () => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
