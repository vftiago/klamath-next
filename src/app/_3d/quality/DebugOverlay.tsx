"use client";

import { useFrame, useThree } from "@react-three/fiber";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { useQuality } from "./QualityContext";

export type RenderStats = {
  calls: number;
  frameMs: number;
  triangles: number;
};

/** Stats live in a ref: written from inside the canvas each frame, read by the overlay on an interval. */
export const createStats = (): RenderStats => ({ calls: 0, frameMs: 0, triangles: 0 });

type ProbeProps = {
  statsRef: RefObject<RenderStats>;
};

/**
 * Inside the canvas: accumulates the renderer's counters across every pass of the frame (reflection,
 * main, post) and a smoothed frame time into the ref. Runs after `PostEffect` (priority 1).
 */
export const StatsProbe = ({ statsRef }: ProbeProps) => {
  const gl = useThree((state) => state.gl);
  const lastRef = useRef(-1);

  useEffect(() => {
    // three resets the counters on every render() call by default; we want the whole frame.
    // eslint-disable-next-line react-hooks/immutability -- configuring the renderer is this effect's job
    gl.info.autoReset = false;
    return () => {
      gl.info.autoReset = true;
    };
  }, [gl]);

  useFrame(() => {
    const stats = statsRef.current;
    // wall clock, not the R3F clock: under on-demand rendering that clock restarts from zero after idling
    const now = performance.now();
    if (lastRef.current >= 0) {
      stats.frameMs = stats.frameMs * 0.9 + (now - lastRef.current) * 0.1;
    }
    lastRef.current = now;
    stats.calls = gl.info.render.calls;
    stats.triangles = gl.info.render.triangles;
    gl.info.reset();
  }, 2);

  return null;
};

type OverlayProps = {
  statsRef: RefObject<RenderStats>;
};

/** Outside the canvas: a small fixed readout, shown with `?debug=1`. */
export const DebugOverlay = ({ statsRef }: OverlayProps) => {
  const quality = useQuality();
  const [snapshot, setSnapshot] = useState<RenderStats>(createStats);

  useEffect(() => {
    const id = setInterval(() => setSnapshot({ ...statsRef.current }), 500);
    return () => clearInterval(id);
  }, [statsRef]);

  return (
    <div className="fixed bottom-4 left-24 z-20 rounded-xl border border-white/20 bg-gray-500/10 px-3 py-2 font-mono text-xs tracking-wide text-white/80">
      <div>tier {quality.tier}</div>
      <div>frame {snapshot.frameMs.toFixed(1)} ms</div>
      <div>calls {snapshot.calls}</div>
      <div>tris {snapshot.triangles}</div>
    </div>
  );
};
