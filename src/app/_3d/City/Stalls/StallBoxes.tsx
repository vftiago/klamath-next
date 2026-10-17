import { GLSL3 } from "three";
import fragmentShader from "./stall-box.frag";
import vertexShader from "./stall-box.vert";
import type { StallParts } from "./stall-geometry";

type StallBoxesProps = {
  boxes: StallParts["boxes"];
};

/** The stalls' structure: flat-coloured boxes (walls, posts, counters, sloped roofs, signboards) in one draw. */
const StallBoxes = ({ boxes }: StallBoxesProps) => {
  if (boxes.count === 0) {
    return null;
  }

  return (
    <instancedMesh args={[undefined, undefined, boxes.count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]}>
        <instancedBufferAttribute args={[boxes.offset, 3]} attach="attributes-aOffset" />
        <instancedBufferAttribute args={[boxes.size, 3]} attach="attributes-aSize" />
        <instancedBufferAttribute args={[boxes.color, 3]} attach="attributes-aColor" />
        <instancedBufferAttribute args={[boxes.params, 4]} attach="attributes-aParams" />
      </boxGeometry>
      <rawShaderMaterial fragmentShader={fragmentShader} glslVersion={GLSL3} vertexShader={vertexShader} />
    </instancedMesh>
  );
};

export default StallBoxes;
