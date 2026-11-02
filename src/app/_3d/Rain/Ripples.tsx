import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { InstancedBufferAttribute, RawShaderMaterial } from "three";
import { DynamicDrawUsage, GLSL3 } from "three";
import { depthScale, GROUND_Y, REF_VIEW_HEIGHT } from "../City/config";
import { getSceneTime } from "../utils";
import { RAIN } from "./config";
import { landingZ, waterLandingRate, waterSpan } from "./landings";
import fragmentShader from "./ripple.frag";
import vertexShader from "./ripple.vert";

type RipplesProps = {
  /** Falling drops, as passed to `Rain`: the ripple rate follows their landings on the water. */
  drops: number;
  /** World z of the shoreline: ripples only land on the water in front of it. */
  shoreZ: number;
};

/** Longest ripple life in seconds (`0.4 + 0.4 * depth` below); with the rate, it sizes the ring pool. */
const MAX_LIFE = 0.8;

/**
 * Ripples where drops meet the water: a statistical spawn rate into a ring buffer of instanced rings, with
 * the per-ripple animation done in the shader. The rate is the drops' landing rate on the water (from the
 * fall model in `landings.ts`) times `RAIN.ripples`, and depths follow where those landings fall, so more
 * rain means more ripples. Positions are random rather than under each streak.
 */
const Ripples = ({ drops, shoreZ }: RipplesProps) => {
  const materialRef = useRef<RawShaderMaterial>(null);
  const rippleRef = useRef<InstancedBufferAttribute>(null);
  const lookRef = useRef<InstancedBufferAttribute>(null);
  const cursorRef = useRef(0);
  const aspect = useThree((state) => state.viewport.aspect);

  const rate = waterLandingRate(drops, shoreZ) * RAIN.ripples;
  // enough rings that none is recycled while still alive, with headroom for frame-time jitter
  const pool = Math.max(16, Math.ceil(rate * MAX_LIFE * 1.2));
  const buffers = useMemo(
    () => ({ look: new Float32Array(pool * 3), ripple: new Float32Array(pool * 4).fill(-1) }),
    [pool],
  );
  const uniforms = useMemo(() => ({ uGround: { value: GROUND_Y }, uTime: { value: 0 } }), []);

  useFrame((_, delta) => {
    const material = materialRef.current;
    const ripple = rippleRef.current;
    const look = lookRef.current;

    if (!material || !ripple || !look) {
      return;
    }

    const t = getSceneTime();
    material.uniforms.uTime.value = t;

    const dt = Math.min(delta, 0.05);
    // the rain's 29 s intensity pulse dims the rings; the number of drops landing doesn't pulse
    const pulse = 0.8 + 0.2 * Math.sin((t * Math.PI * 2) / 29);
    const expected = rate * dt;
    const spawns = Math.floor(expected) + (Math.random() < expected % 1 ? 1 : 0);

    const rippleArray = ripple.array as Float32Array;
    const lookArray = look.array as Float32Array;

    const water = waterSpan(shoreZ);

    for (let n = 0; n < spawns; n++) {
      const i = cursorRef.current % pool;
      cursorRef.current = (i + 1) % pool;

      // nearer landings are bigger, longer-lived and brighter, as in the reference's depth ramp
      const z = landingZ(Math.random(), shoreZ);
      const depth = (z - water.far) / (water.near - water.far);
      const s = depthScale(z);
      const halfWidth = 0.7 * aspect * REF_VIEW_HEIGHT * s;
      const tintRoll = Math.random();

      // the reference's 2-22 px radius and 0.12-0.42 alpha, scaled up a little: in 3D the rings lie flat on
      // the water and the reflection wobble competes with them
      rippleArray.set([(Math.random() * 2 - 1) * halfWidth, z, t, 0.4 + 0.4 * depth], i * 4);
      lookArray.set(
        [(3 + 26 * depth) * s, (0.18 + 0.4 * depth) * pulse, tintRoll < 0.15 ? (tintRoll < 0.075 ? 1 : 2) : 0],
        i * 3,
      );
    }

    if (spawns > 0) {
      ripple.needsUpdate = true;
      look.needsUpdate = true;
    }
  });

  return (
    <instancedMesh args={[undefined, undefined, pool]} frustumCulled={false} renderOrder={9}>
      <planeGeometry args={[1, 1]}>
        <instancedBufferAttribute
          args={[buffers.ripple, 4]}
          attach="attributes-aRipple"
          ref={rippleRef}
          usage={DynamicDrawUsage}
        />
        <instancedBufferAttribute
          args={[buffers.look, 3]}
          attach="attributes-aLook"
          ref={lookRef}
          usage={DynamicDrawUsage}
        />
      </planeGeometry>
      <rawShaderMaterial
        depthWrite={false}
        fragmentShader={fragmentShader}
        glslVersion={GLSL3}
        ref={materialRef}
        transparent={true}
        uniforms={uniforms}
        vertexShader={vertexShader}
      />
    </instancedMesh>
  );
};

export default Ripples;
