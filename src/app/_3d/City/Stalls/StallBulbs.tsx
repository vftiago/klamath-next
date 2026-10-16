import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { RawShaderMaterial } from "three";
import { GLSL3 } from "three";
import fragmentShader from "./bulb.frag";
import vertexShader from "./bulb.vert";
import type { StallParts } from "./stall-geometry";

type StallBulbsProps = {
  bulbs: StallParts["bulbs"];
};

/** Warm bulbs strung along the stall roofs, one Points draw. */
const StallBulbs = ({ bulbs }: StallBulbsProps) => {
  const materialRef = useRef<RawShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uProjectionScale: { value: 1 } }), []);

  useFrame((state) => {
    const materialUniforms = materialRef.current?.uniforms;

    if (!materialUniforms) {
      return;
    }

    // projectionMatrix[1][1] = 1 / tan(fov / 2); point sizes are in drawing-buffer pixels
    materialUniforms.uProjectionScale.value =
      0.5 * state.size.height * state.viewport.dpr * state.camera.projectionMatrix.elements[5];
  });

  if (bulbs.count === 0) {
    return null;
  }

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute args={[bulbs.position, 3]} attach="attributes-position" />
        <bufferAttribute args={[bulbs.radii, 2]} attach="attributes-aRadii" />
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

export default StallBulbs;
