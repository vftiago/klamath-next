import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { RawShaderMaterial } from "three";
import { GLSL3 } from "three";
import { getSceneTime } from "../../utils";
import type { CityLayout } from "../generate";
import fragmentShader from "./beacon.frag";
import vertexShader from "./beacon.vert";

type BeaconsProps = {
  /** Blink; false keeps every beacon lit. */
  blink?: boolean;
  layout: CityLayout;
};

type BeaconAttributes = {
  count: number;
  phase: Float32Array;
  position: Float32Array;
  radii: Float32Array;
};

const buildAttributes = (layout: CityLayout): BeaconAttributes => {
  const count = layout.layers.reduce((sum, layer) => sum + layer.beacons.length, 0);
  const attributes: BeaconAttributes = {
    count,
    phase: new Float32Array(count),
    position: new Float32Array(count * 3),
    radii: new Float32Array(count * 2),
  };

  let i = 0;
  for (const layer of layout.layers) {
    for (const beacon of layer.beacons) {
      // just in front of the mast so the light isn't swallowed by the building's depth test
      attributes.position.set([beacon.x, layout.groundY + beacon.y, layer.z + 2 * layer.scale], i * 3);
      attributes.radii.set([(1.2 + 0.25 * layer.index) * layer.scale, (4 + layer.index) * layer.scale], i * 2);
      attributes.phase[i] = Math.PI * 2 * ((beacon.x * 0.137) % 1) + beacon.phase;
      i++;
    }
  }

  return attributes;
};

/** Blinking red antenna lights on every layer, one Points draw. */
const Beacons = ({ blink = true, layout }: BeaconsProps) => {
  const materialRef = useRef<RawShaderMaterial>(null);
  const attributes = useMemo(() => buildAttributes(layout), [layout]);
  const uniforms = useMemo(
    () => ({
      uBlink: { value: 1 },
      uProjectionScale: { value: 1 },
      uTime: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    const materialUniforms = materialRef.current?.uniforms;

    if (!materialUniforms) {
      return;
    }

    materialUniforms.uTime.value = getSceneTime();
    materialUniforms.uBlink.value = blink ? 1 : 0;
    // projectionMatrix[1][1] = 1 / tan(fov / 2); point sizes are in drawing-buffer pixels
    materialUniforms.uProjectionScale.value =
      0.5 * state.size.height * state.viewport.dpr * state.camera.projectionMatrix.elements[5];
  });

  if (attributes.count === 0) {
    return null;
  }

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute args={[attributes.position, 3]} attach="attributes-position" />
        <bufferAttribute args={[attributes.phase, 1]} attach="attributes-aPhase" />
        <bufferAttribute args={[attributes.radii, 2]} attach="attributes-aRadii" />
      </bufferGeometry>
      <rawShaderMaterial
        depthWrite={false}
        fragmentShader={fragmentShader}
        glslVersion={GLSL3}
        ref={materialRef}
        transparent={true}
        uniforms={uniforms}
        vertexShader={vertexShader}
      />
    </points>
  );
};

export default Beacons;
