import { useSyncExternalStore } from "react";

export const BREAKPOINTS = {
  lg: 1024,
  md: 768,
} as const;

type BreakpointState = {
  isLgScreen: boolean;
  isMdScreen: boolean;
};

const SERVER_SNAPSHOT: BreakpointState = {
  isLgScreen: false,
  isMdScreen: false,
};

let cachedSnapshot: BreakpointState = SERVER_SNAPSHOT;

const getSnapshot = (): BreakpointState => {
  const isLgScreen = window.innerWidth >= BREAKPOINTS.lg;
  const isMdScreen = window.innerWidth >= BREAKPOINTS.md;

  if (cachedSnapshot.isLgScreen !== isLgScreen || cachedSnapshot.isMdScreen !== isMdScreen) {
    cachedSnapshot = { isLgScreen, isMdScreen };
  }

  return cachedSnapshot;
};

const getServerSnapshot = (): BreakpointState => SERVER_SNAPSHOT;

const subscribe = (callback: () => void) => {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};

export const useBreakpoints = () => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
