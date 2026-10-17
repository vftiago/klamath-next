import { useEffect, useMemo, useState } from "react";
import { DoubleSide, GLSL3 } from "three";
import type { CityLayout } from "../generate";
import { GROUND_WIDTH } from "../Ground/Ground";
import Smoke from "./Smoke";
import type { StallSheet } from "./stall-art";
import { createStallSheet } from "./stall-art";
import type { Placement } from "./stall-geometry";
import { buildStallParts, placeStalls } from "./stall-geometry";
import type { StallPlan } from "./stall-plan";
import { planStalls } from "./stall-plan";
import fragmentShader from "./stall.frag";
import vertexShader from "./stall.vert";
import StallBoxes from "./StallBoxes";
import StallBulbs from "./StallBulbs";
import StallGlow from "./StallGlow";

type StallsProps = {
  layout: CityLayout;
  /** Emit smoke; false lets the existing particles fade out. */
  smoke?: boolean;
};

type Variants = { placements: Placement[]; plans: StallPlan[]; sheet: StallSheet };

/** Street level: the kerb at the water, the stalls on the ground plane, and their smoke. */
const Stalls = ({ layout, smoke = true }: StallsProps) => {
  // plans and placements are pure, but the sheet painted from them is DOM work: all three belong in a state
  // initializer (the component remounts with the layout, so the placements never go stale)
  const [{ placements, sheet }] = useState<Variants>(() => {
    const plans = planStalls();
    const placed = placeStalls(layout, plans);
    return { placements: placed, plans, sheet: createStallSheet(plans, placed) };
  });
  const parts = useMemo(() => buildStallParts(layout, placements, sheet), [layout, placements, sheet]);
  const uniforms = useMemo(() => ({ uSheet: { value: sheet.texture } }), [sheet]);

  useEffect(() => {
    return () => sheet.texture.dispose();
  }, [sheet]);

  const { details } = parts;

  return (
    <group>
      {/* kerb at the water; the pavement itself is the ground plane */}
      <mesh position={[0, layout.groundY + 1, layout.shoreZ - 1]}>
        <boxGeometry args={[GROUND_WIDTH, 2, 2]} />
        <meshBasicMaterial color="rgb(44, 18, 52)" />
      </mesh>
      <StallBoxes boxes={parts.boxes} />
      {details.count > 0 ? (
        <instancedMesh args={[undefined, undefined, details.count]} frustumCulled={false}>
          <planeGeometry args={[1, 1]}>
            <instancedBufferAttribute args={[details.offset, 3]} attach="attributes-aOffset" />
            <instancedBufferAttribute args={[details.size, 2]} attach="attributes-aSize" />
            <instancedBufferAttribute args={[details.uv, 4]} attach="attributes-aUv" />
            <instancedBufferAttribute args={[details.flat, 1]} attach="attributes-aFlat" />
          </planeGeometry>
          <rawShaderMaterial
            depthWrite={false}
            fragmentShader={fragmentShader}
            glslVersion={GLSL3}
            side={DoubleSide}
            transparent={true}
            uniforms={uniforms}
            vertexShader={vertexShader}
          />
        </instancedMesh>
      ) : null}
      <StallBulbs bulbs={parts.bulbs} />
      <StallGlow glows={parts.glows} groundY={layout.groundY} />
      <Smoke active={smoke} sources={parts.smokeSources} />
    </group>
  );
};

export default Stalls;
