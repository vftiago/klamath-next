import { useMemo } from "react";
import { GLSL3 } from "three";
import { depthScale, GROUND_Y, REF_VIEW_HEIGHT } from "../config";
import fragmentShader from "./sky.frag";
import vertexShader from "./sky.vert";

type SkyProps = {
  aspect: number;
};

/** Depth of the sky plane: well behind the farthest layer, and inside `CAMERA.far` from the default eye. */
const SKY_Z = -6000;

/**
 * Night sky: a large vertical plane far behind the city with a world-space gradient, so it is part of the
 * rendered image (CRT pass, later the river reflection) instead of the page background. The page's CSS
 * background mirrors these colors as the fallback for the loading, reduced-motion and no-WebGL states.
 */
const Sky = ({ aspect }: SkyProps) => {
  const scale = depthScale(SKY_Z);
  // cover the frustum at this depth with room for camera moves
  const width = aspect * REF_VIEW_HEIGHT * scale * 2;
  const height = REF_VIEW_HEIGHT * scale * 2;
  // most of the sky is seen above the rooftops, so the dusk gradient is stretched well past the skyline height
  // to keep the pink-to-purple transition in view instead of hidden behind the buildings
  const fade = 1.6 * REF_VIEW_HEIGHT * scale;

  const uniforms = useMemo(() => ({ uFade: { value: fade }, uGround: { value: GROUND_Y } }), [fade]);

  return (
    <mesh frustumCulled={false} position={[0, GROUND_Y + height / 2 - fade * 0.25, SKY_Z]} renderOrder={-1}>
      <planeGeometry args={[width, height]} />
      <rawShaderMaterial
        depthWrite={false}
        fragmentShader={fragmentShader}
        glslVersion={GLSL3}
        uniforms={uniforms}
        vertexShader={vertexShader}
      />
    </mesh>
  );
};

export default Sky;
