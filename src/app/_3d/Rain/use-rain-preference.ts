import { useSyncExternalStore } from "react";

const STORAGE_KEY = "klamath:rain";
const CHANGE_EVENT = "klamath:rain-change";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

type Stored = "off" | "on";

const readStored = (): null | Stored => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "on" || value === "off" ? value : null;
  } catch {
    return null;
  }
};

/** Rain is on unless the viewer turned it off, or asked for reduced motion and never turned it on. */
const getSnapshot = (): boolean => {
  const stored = readStored();
  return stored ? stored === "on" : !window.matchMedia(REDUCED_MOTION).matches;
};

const getServerSnapshot = (): boolean => false;

const subscribe = (callback: () => void) => {
  const mediaQuery = window.matchMedia(REDUCED_MOTION);
  mediaQuery.addEventListener("change", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    mediaQuery.removeEventListener("change", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};

/** Whether the rain overlay should run. Persisted per browser; defaults follow `prefers-reduced-motion`. */
export const useRainPreference = (): boolean => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export const setRainEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // storage unavailable (private mode, quota): the change still applies for this page
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};
