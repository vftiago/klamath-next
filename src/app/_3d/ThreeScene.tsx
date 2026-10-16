"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { useBreakpoints } from "@/app/_shared/utils/use-breakpoints";
import { usePrefersReducedMotion } from "@/app/_shared/utils/use-prefers-reduced-motion";
import City from "./City/City";
import { CAMERA, GROUND_Y } from "./City/config";
import PostEffect from "./PostEffect/PostEffect";
import { createStats, DebugOverlay, StatsProbe } from "./quality/DebugOverlay";
import { qualityFor, QualityProvider } from "./quality/QualityContext";
import { readForcedTier, useQualityTier } from "./quality/use-quality-tier";
import { useRainPreference } from "./Rain/use-rain-preference";
import { getSceneTime } from "./utils";

// The eye sits just above the water. The current route views keep the camera level (look-at height equals
// eye height, look-at x equals eye x) and push the horizon down with a vertical lens shift (see `LensShift`),
// so verticals stay vertical like the flat reference illustration. Pitched and yawed views are fine too now
// that the window grid is box-filtered; camera fine-tuning is deferred until the river exists (plan phase 8).
const EYE_Y = GROUND_Y + 50;

/** Fraction of the viewport height the horizon is shifted down by the lens shift. */
const HORIZON_SHIFT = 0.12;

/** Height of the aerial views above the ground line; the far layer's tallest buildings top out near +1600. */
const AERIAL_Y = GROUND_Y + 1700;

// TESTING: the sub-routes use pitched aerial views so the city can be inspected from above; the level,
// lens-shifted framing of the home route is the intended look. Re-tune these before shipping.
const CAMERA_STATES: Record<string, { lookAt: Vector3; position: Vector3 }> = {
  // Home: slightly raised and pulled back
  "/": {
    lookAt: new Vector3(0, EYE_Y + 60, 0),
    position: new Vector3(0, EYE_Y + 60, 1100),
  },
  // About: aerial view from the right, looking down across the layers
  "/about": {
    lookAt: new Vector3(0, GROUND_Y + 100, -600),
    position: new Vector3(1100, AERIAL_Y - 500, 700),
  },
  // Projects: near top-down, looking steeply down at the near and middle layers
  "/projects": {
    lookAt: new Vector3(0, GROUND_Y, -500),
    position: new Vector3(0, AERIAL_Y, 500),
  },
  // Repositories: aerial view from the left, looking down the length of the river
  "/repositories": {
    lookAt: new Vector3(0, GROUND_Y + 100, -800),
    position: new Vector3(-1100, AERIAL_Y - 300, 900),
  },
};

const DEFAULT_CAMERA_STATE = CAMERA_STATES["/"];

const LERP_SPEED = 5;

// Scrolling lowers the camera a little; clamped so it never dips under the river surface.
const SCROLL_FACTOR = 1 / 6;
const SCROLL_MIN_OFFSET = -70;

/** How close (world units) the camera must be to its target before on-demand rendering may idle. */
const SETTLED_DISTANCE = 0.5;

const CameraController = () => {
  const pathname = usePathname();
  const invalidate = useThree((state) => state.invalidate);

  const targetPosition = useRef(DEFAULT_CAMERA_STATE.position.clone());
  const targetLookAt = useRef(DEFAULT_CAMERA_STATE.lookAt.clone());
  const currentLookAt = useRef(DEFAULT_CAMERA_STATE.lookAt.clone());
  const scrollOffset = useRef(0);

  useEffect(() => {
    const state = CAMERA_STATES[pathname ?? "/"] ?? DEFAULT_CAMERA_STATE;
    targetPosition.current.copy(state.position);
    targetLookAt.current.copy(state.lookAt);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      scrollOffset.current = Math.max(SCROLL_MIN_OFFSET, -window.scrollY * SCROLL_FACTOR);
      invalidate();
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [invalidate]);

  useFrame((state, delta) => {
    const camera = state.camera;
    const lerpFactor = MathUtils.clamp(delta * LERP_SPEED, 0, 1);

    camera.position.x = MathUtils.lerp(camera.position.x, targetPosition.current.x, lerpFactor);
    camera.position.y = MathUtils.lerp(camera.position.y, targetPosition.current.y + scrollOffset.current, lerpFactor);
    camera.position.z = MathUtils.lerp(camera.position.z, targetPosition.current.z, lerpFactor);

    currentLookAt.current.x = MathUtils.lerp(currentLookAt.current.x, targetLookAt.current.x, lerpFactor);
    currentLookAt.current.y = MathUtils.lerp(
      currentLookAt.current.y,
      targetLookAt.current.y + scrollOffset.current,
      lerpFactor,
    );
    currentLookAt.current.z = MathUtils.lerp(currentLookAt.current.z, targetLookAt.current.z, lerpFactor);

    camera.lookAt(currentLookAt.current);

    // under on-demand rendering, keep rendering until the move settles
    const targetY = targetPosition.current.y + scrollOffset.current;
    const remaining =
      Math.abs(camera.position.x - targetPosition.current.x) +
      Math.abs(camera.position.y - targetY) +
      Math.abs(camera.position.z - targetPosition.current.z) +
      currentLookAt.current.distanceTo(targetLookAt.current);
    if (remaining > SETTLED_DISTANCE) {
      state.invalidate();
    }
  });

  return null;
};

/** Under on-demand rendering, keeps frames coming while the post-effect fades the scene in. */
const FadeInKeepAlive = () => {
  useFrame((state) => {
    if (getSceneTime() < 4) {
      state.invalidate();
    }
  });

  return null;
};

/**
 * Vertical lens shift: offsets the frustum instead of pitching the camera, so the horizon sits lower on screen
 * while building faces stay parallel to the image plane.
 */
const LensShift = () => {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) {
      return;
    }

    camera.setViewOffset(size.width, size.height, 0, -HORIZON_SHIFT * size.height, size.width, size.height);

    return () => camera.clearViewOffset();
  }, [camera, size]);

  return null;
};

const ThreeScene = () => {
  const { isMdScreen } = useBreakpoints();
  const prefersReducedMotion = usePrefersReducedMotion();
  const rain = useRainPreference();
  // URL flags, read once: the scene only runs in the browser (dynamic import, ssr: false)
  const [flags] = useState(() => ({
    debug: new URLSearchParams(window.location.search).has("debug"),
    forced: readForcedTier(),
  }));
  const statsRef = useRef(createStats());
  const tier = useQualityTier({ forced: flags.forced, initial: isMdScreen ? "full" : "reduced" });
  const quality = useMemo(() => qualityFor(tier), [tier]);

  // the scene is continuously animated decoration — honor reduced motion by not rendering it at all
  if (prefersReducedMotion) {
    return <div className="abstract-bg fixed -z-10 h-screen w-full" />;
  }

  return (
    <QualityProvider value={quality}>
      <div className="abstract-bg fixed -z-10 h-screen w-full">
        <Canvas
          camera={{
            far: CAMERA.far,
            fov: CAMERA.fov,
            near: CAMERA.near,
            position: [0, EYE_Y + 60, 1100],
          }}
          dpr={[1, quality.dprMax]}
          frameloop={quality.renderOnDemand ? "demand" : "always"}
          gl={{
            antialias: true,
          }}
        >
          <CameraController />
          <LensShift />
          <FadeInKeepAlive />
          <City rain={rain} />
          <PostEffect />
          {flags.debug ? <StatsProbe statsRef={statsRef} /> : null}
        </Canvas>
      </div>
      {flags.debug ? <DebugOverlay statsRef={statsRef} /> : null}
    </QualityProvider>
  );
};

export default ThreeScene;
