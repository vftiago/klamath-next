import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { RawShaderMaterial } from "three";
import { GLSL3, Vector2, Vector3 } from "three";
import { CAMERA, GROUND_Y, REF_VIEW_HEIGHT } from "../City/config";
import { getSceneTime } from "../utils";
import fragmentShader from "./rain.frag";
import vertexShader from "./rain.vert";

type RainProps = {
  /** Number of drops; the reference caps at 480 and scales with viewport width. */
  drops?: number;
};

/** Drops fall between these world depths: from among the mid layers to just in front of the camera. */
const DEPTH_FAR = -450;
const DEPTH_NEAR = 940;

/** Deterministic seeds so the pattern is stable across remounts. */
const buildSeeds = (count: number): Float32Array => {
  const seeds = new Float32Array(count * 4);
  let a = 1337;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < count * 4; i++) {
    seeds[i] = rand();
  }
  return seeds;
};

/**
 * Rain as instanced line quads whose motion lives entirely in the vertex shader: fall speed, length,
 * drift, wind sway, fade-in and tint all derive from per-drop seeds and the time, as in the reference.
 */
const Rain = ({ drops = 480 }: RainProps) => {
  const materialRef = useRef<RawShaderMaterial>(null);
  const aspect = useThree((state) => state.viewport.aspect);

  const seeds = useMemo(() => buildSeeds(drops), [drops]);
  const uniforms = useMemo(
    () => ({
      uDepthRange: { value: new Vector2(DEPTH_FAR, DEPTH_NEAR) },
      uGround: { value: GROUND_Y },
      uTime: { value: 0 },
      uView: { value: new Vector3(aspect * REF_VIEW_HEIGHT, REF_VIEW_HEIGHT, CAMERA.z) },
      uWeather: { value: new Vector2(0.3, 1) },
    }),
    [aspect],
  );

  useFrame(() => {
    const materialUniforms = materialRef.current?.uniforms;

    if (!materialUniforms) {
      return;
    }

    const t = getSceneTime();
    materialUniforms.uTime.value = t;
    // reference: slow wind sway and a 29 s intensity pulse
    const wind = 0.3 + 0.06 * Math.sin((t * Math.PI * 2) / 17) + 0.02 * Math.sin((t * Math.PI * 2) / 6.3);
    const pulse = 0.8 + 0.2 * Math.sin((t * Math.PI * 2) / 29);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Three.js uniforms are loosely typed
    materialUniforms.uWeather.value.set(wind, pulse);
  });

  return (
    <instancedMesh args={[undefined, undefined, drops]} frustumCulled={false} renderOrder={10}>
      <planeGeometry args={[1, 1]}>
        <instancedBufferAttribute args={[seeds, 4]} attach="attributes-aSeed" />
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

export default Rain;
