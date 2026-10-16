import { useMemo } from "react";
import { GLSL3 } from "three";
import { LAYERS } from "../config";
import type { CityLayout } from "../generate";
import fragmentShader from "./ground.frag";
import vertexShader from "./ground.vert";

type GroundProps = {
  layout: CityLayout;
};

/** The ground runs this far behind the farthest layer, so the far buildings never stand at its edge. */
const BEYOND_FAR = 1000;

/** As wide as the river, so pitched or trucked cameras never see past its side; the kerb matches. */
export const GROUND_WIDTH = 24000;

/**
 * Dark ground under the whole city: one surface from the shoreline (the stall pavement included) back past
 * the farthest layer. Without it the river plane shows between the layers wherever a gap or a raised camera
 * exposes the street level.
 */
const Ground = ({ layout }: GroundProps) => {
  const nearZ = layout.shoreZ;
  const farZ = LAYERS[0].z - BEYOND_FAR;
  const depth = nearZ - farZ;
  const uniforms = useMemo(() => ({ uFarZ: { value: farZ }, uNearZ: { value: nearZ } }), [farZ, nearZ]);

  return (
    <mesh frustumCulled={false} position={[0, layout.groundY + 0.3, nearZ - depth / 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[GROUND_WIDTH, depth]} />
      <rawShaderMaterial
        fragmentShader={fragmentShader}
        glslVersion={GLSL3}
        uniforms={uniforms}
        vertexShader={vertexShader}
      />
    </mesh>
  );
};

export default Ground;
