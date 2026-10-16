import { useMemo } from "react";
import { AdditiveBlending, GLSL3 } from "three";
import { STALL } from "../config";
import fragmentShader from "./glow.frag";
import vertexShader from "./glow.vert";
import type { StallParts } from "./stall-geometry";

type StallGlowProps = {
  glows: StallParts["glows"];
  groundY: number;
};

/** Warm volumetric haze around each stall: additive spheres shaded by the view ray's chord through them. */
const StallGlow = ({ glows, groundY }: StallGlowProps) => {
  const uniforms = useMemo(
    () => ({ uGround: { value: groundY + 0.3 }, uIntensity: { value: STALL.glow.peak } }),
    [groundY],
  );

  if (glows.count === 0) {
    return null;
  }

  return (
    <instancedMesh args={[undefined, undefined, glows.count]} frustumCulled={false}>
      <sphereGeometry args={[1, 16, 12]}>
        <instancedBufferAttribute args={[glows.center, 3]} attach="attributes-aCenter" />
        <instancedBufferAttribute args={[glows.radius, 1]} attach="attributes-aRadius" />
        <instancedBufferAttribute args={[glows.color, 3]} attach="attributes-aColor" />
      </sphereGeometry>
      <rawShaderMaterial
        blending={AdditiveBlending}
        depthWrite={false}
        fragmentShader={fragmentShader}
        glslVersion={GLSL3}
        transparent={true}
        uniforms={uniforms}
        vertexShader={vertexShader}
      />
    </instancedMesh>
  );
};

export default StallGlow;
