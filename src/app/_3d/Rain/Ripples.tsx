import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { InstancedBufferAttribute, RawShaderMaterial } from "three";
import { DynamicDrawUsage, GLSL3 } from "three";
import { CAMERA, GROUND_Y, REF_VIEW_HEIGHT } from "../City/config";
import { getSceneTime } from "../utils";
import fragmentShader from "./ripple.frag";
import vertexShader from "./ripple.vert";

type RipplesProps = {
  /** Ripples spawned per second at full intensity; scaled by the viewport width like the reference. */
  rate?: number;
  /** World z of the shoreline: ripples only land on the water in front of it. */
  shoreZ: number;
};

const POOL = 256;
/** Ripples land between the shore and just in front of the camera. */
const DEPTH_NEAR = 900;

/**
 * Ripples where drops meet the water. The reference spawns one per landing drop plus a random sprinkle
 * across the ground band; here both are one statistical spawn rate into a ring buffer of instanced rings,
 * with the per-ripple animation done in the shader.
 */
const Ripples = ({ rate = 180, shoreZ }: RipplesProps) => {
  const materialRef = useRef<RawShaderMaterial>(null);
  const rippleRef = useRef<InstancedBufferAttribute>(null);
  const lookRef = useRef<InstancedBufferAttribute>(null);
  const cursorRef = useRef(0);
  const aspect = useThree((state) => state.viewport.aspect);

  const buffers = useMemo(
    () => ({ look: new Float32Array(POOL * 3), ripple: new Float32Array(POOL * 4).fill(-1) }),
    [],
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
    const pulse = 0.8 + 0.2 * Math.sin((t * Math.PI * 2) / 29);
    const expected = rate * pulse * dt;
    const spawns = Math.floor(expected) + (Math.random() < expected % 1 ? 1 : 0);

    const rippleArray = ripple.array as Float32Array;
    const lookArray = look.array as Float32Array;

    for (let n = 0; n < spawns; n++) {
      const i = cursorRef.current;
      cursorRef.current = (i + 1) % POOL;

      // nearer landings are bigger, longer-lived and brighter, as in the reference's depth ramp
      const depth = Math.pow(Math.random(), 0.8);
      const z = shoreZ + 10 + (DEPTH_NEAR - shoreZ - 10) * depth;
      const s = (CAMERA.z - z) / 1024;
      const halfWidth = 0.7 * aspect * REF_VIEW_HEIGHT * s;
      const tintRoll = Math.random();

      // the reference's 2-22 px radius and 0.12-0.42 alpha, scaled up a little: in 3D the rings lie flat on
      // the water and the reflection wobble competes with them
      rippleArray.set([(Math.random() * 2 - 1) * halfWidth, z, t, 0.4 + 0.4 * depth], i * 4);
      lookArray.set(
        [(3 + 26 * depth) * s, 0.18 + 0.4 * depth, tintRoll < 0.15 ? (tintRoll < 0.075 ? 1 : 2) : 0],
        i * 3,
      );
    }

    if (spawns > 0) {
      ripple.needsUpdate = true;
      look.needsUpdate = true;
    }
  });

  return (
    <instancedMesh args={[undefined, undefined, POOL]} frustumCulled={false} renderOrder={9}>
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
