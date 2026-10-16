import { useMemo } from "react";
import { GLSL3 } from "three";
import { LAYERS } from "../config";
import type { CityLayout } from "../generate";
import fragmentShader from "./ground.frag";
import vertexShader from "./ground.vert";

type GroundProps = {
  layout: CityLayout;
};

/** Near edge of the ground: where the stall pavement starts, behind the nearest building fronts. */
export const GROUND_NEAR_Z = -20;

/** The ground runs this far behind the farthest layer, so the far buildings never stand at its edge. */
const BEYOND_FAR = 300;

/**
 * Dark ground under the whole city, from the stall pavement back past the farthest layer. Without it the
 * river plane shows between the layers wherever a gap or a raised camera exposes the street level.
 */
const Ground = ({ layout }: GroundProps) => {
  const farZ = LAYERS[0].z - BEYOND_FAR;
  const depth = GROUND_NEAR_Z - farZ;
  // the farthest layer is the widest; cover it fully
  const width = Math.max(...layout.layers.map((layer) => layer.span));

  const uniforms = useMemo(() => ({ uFarZ: { value: farZ }, uNearZ: { value: GROUND_NEAR_Z } }), [farZ]);

  return (
    <mesh
      frustumCulled={false}
      position={[0, layout.groundY + 0.3, GROUND_NEAR_Z - depth / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[width, depth]} />
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
