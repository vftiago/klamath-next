import { useEffect, useState, useCallback } from "react";

export const BREAKPOINTS = {
  md: 768,
  lg: 1024,
} as const;

type BreakpointState = {
  isMdScreen: boolean;
  isLgScreen: boolean;
};

const INITIAL_BREAKPOINT_STATE: BreakpointState = {
  isMdScreen: false,
  isLgScreen: false,
};

export const useBreakpoints = () => {
  const [screenState, setScreenState] = useState<BreakpointState>(INITIAL_BREAKPOINT_STATE);

  const calculateScreenState = useCallback(
    (): BreakpointState => ({
      isMdScreen: window.innerWidth >= BREAKPOINTS.md,
      isLgScreen: window.innerWidth >= BREAKPOINTS.lg,
    }),
    [],
  );

  const handleResize = useCallback(() => {
    setScreenState(calculateScreenState());
  }, [calculateScreenState]);

  useEffect(() => {
    setScreenState(calculateScreenState());

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize, calculateScreenState]);

  return screenState;
};
