import { useEffect, useMemo, useState } from "react";
import { GLSL3 } from "three";
import { mulberry32 } from "../../utils";
import { STALL_CLUSTER, STALL_CLUSTER_GAP, STALL_SCALE } from "../config";
import type { CityLayout } from "../generate";
import { GROUND_WIDTH } from "../Ground/Ground";
import Smoke from "./Smoke";
import type { SmokeSource } from "./Smoke";
import type { StallSheet } from "./stall-art";
import { createStallSheet } from "./stall-art";
import fragmentShader from "./stall.frag";
import vertexShader from "./stall.vert";

type StallsProps = {
  layout: CityLayout;
  /** Spawn stall smoke. */
  smoke?: boolean;
};

type StallAttributes = {
  count: number;
  offset: Float32Array;
  size: Float32Array;
  smokeSources: SmokeSource[];
  uv: Float32Array;
};

const SEED = 2028;

/**
 * Clusters of stalls along the nearest layer: stalls 8-18 px apart inside a cluster, `STALL_CLUSTER_GAP`
 * between clusters, every sprite drawn at `STALL_SCALE`. Each picks a painted variant from the sheet.
 */
const placeStalls = (layout: CityLayout, sheet: StallSheet): StallAttributes => {
  const layer = layout.layers[layout.layers.length - 1];
  const placements: { cell: StallSheet["cells"][number]; left: number }[] = [];

  if (layer && sheet.cells.length) {
    const rand = mulberry32(SEED);
    const half = layer.span / 2;
    let x = -half - 60 * rand();

    while (x < half) {
      const clusterSize = STALL_CLUSTER.min + Math.floor((STALL_CLUSTER.extra + 1) * rand());
      for (let k = 0; k < clusterSize && x < half; k++) {
        const cell = sheet.cells[Math.floor(rand() * sheet.cells.length)];
        if (!cell) break;
        placements.push({ cell, left: x });
        x += (cell.stallWidth + 8 + 10 * rand()) * STALL_SCALE;
      }
      x += STALL_CLUSTER_GAP.min + STALL_CLUSTER_GAP.extra * rand();
    }
  }

  const count = placements.length;
  const attributes: StallAttributes = {
    count,
    offset: new Float32Array(count * 3),
    size: new Float32Array(count * 2),
    smokeSources: [],
    uv: new Float32Array(count * 4),
  };

  placements.forEach(({ cell, left }, i) => {
    const k = STALL_SCALE;
    const padX = ((cell.width - cell.stallWidth) / 2) * k;
    attributes.offset.set([left - padX, layout.groundY, layout.stallZ], i * 3);
    attributes.size.set([cell.width * k, cell.height * k], i * 2);
    attributes.uv.set(cell.uv, i * 4);
    attributes.smokeSources.push({
      left: left - padX + cell.smokeLeft * k,
      width: cell.smokeWidth * k,
      x: left + (cell.stallWidth * k) / 2,
      y: layout.groundY + cell.smokeY * k,
      z: layout.stallZ + 1,
    });
  });

  return attributes;
};

/** Street level: the kerb at the water, the stalls on the ground plane, and their smoke. */
const Stalls = ({ layout, smoke = true }: StallsProps) => {
  // DOM work (the sprite sheet canvas) belongs in a state initializer, not render
  const [sheet] = useState(() => createStallSheet());
  const attributes = useMemo(() => placeStalls(layout, sheet), [layout, sheet]);
  const uniforms = useMemo(() => ({ uSheet: { value: sheet.texture } }), [sheet]);

  useEffect(() => {
    return () => sheet.texture.dispose();
  }, [sheet]);

  return (
    <group>
      {/* kerb at the water; the pavement itself is the ground plane */}
      <mesh position={[0, layout.groundY + 1, layout.shoreZ - 1]}>
        <boxGeometry args={[GROUND_WIDTH, 2, 2]} />
        <meshBasicMaterial color="rgb(44, 18, 52)" />
      </mesh>
      {attributes.count > 0 ? (
        <instancedMesh args={[undefined, undefined, attributes.count]} frustumCulled={false}>
          <planeGeometry args={[1, 1]}>
            <instancedBufferAttribute args={[attributes.offset, 3]} attach="attributes-aOffset" />
            <instancedBufferAttribute args={[attributes.size, 2]} attach="attributes-aSize" />
            <instancedBufferAttribute args={[attributes.uv, 4]} attach="attributes-aUv" />
          </planeGeometry>
          <rawShaderMaterial
            depthWrite={false}
            fragmentShader={fragmentShader}
            glslVersion={GLSL3}
            transparent={true}
            uniforms={uniforms}
            vertexShader={vertexShader}
          />
        </instancedMesh>
      ) : null}
      <Smoke active={smoke} sources={attributes.smokeSources} />
    </group>
  );
};

export default Stalls;
