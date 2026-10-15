import { useMemo } from "react";
import { GLSL3 } from "three";
import { NEAREST_LAYER } from "../config";
import type { CityLayout } from "../generate";
import fragmentShader from "./billboard.frag";
import vertexShader from "./billboard.vert";

type BillboardsProps = {
  layout: CityLayout;
};

type BillboardAttributes = {
  color: Float32Array;
  count: number;
  layer: Float32Array;
  offset: Float32Array;
  size: Float32Array;
};

/** Neon palette slots, weighted like the reference: pink, cyan, lime, pink, cyan. */
const NEON_SLOTS = [
  [255, 45, 170],
  [40, 235, 255],
  [214, 255, 40],
  [255, 45, 170],
  [40, 235, 255],
].map((rgb) => rgb.map((c) => c / 255));

const buildAttributes = (layout: CityLayout): BillboardAttributes => {
  const count = layout.layers.reduce((sum, layer) => sum + layer.billboards.length, 0);
  const attributes: BillboardAttributes = {
    color: new Float32Array(count * 3),
    count,
    layer: new Float32Array(count * 2),
    offset: new Float32Array(count * 3),
    size: new Float32Array(count * 2),
  };

  let i = 0;
  for (const layer of layout.layers) {
    for (const board of layer.billboards) {
      attributes.offset.set([board.x, layout.groundY + board.y, layer.z + board.z], i * 3);
      attributes.size.set([board.width, board.height], i * 2);
      attributes.color.set(NEON_SLOTS[board.colorSlot] ?? NEON_SLOTS[0], i * 3);
      attributes.layer.set([layer.index / NEAREST_LAYER, layer.scale], i * 2);
      i++;
    }
  }

  return attributes;
};

/** Rooftop billboards: instanced quads with a neon frame and text bars, all layers in one draw. */
const Billboards = ({ layout }: BillboardsProps) => {
  const attributes = useMemo(() => buildAttributes(layout), [layout]);

  if (attributes.count === 0) {
    return null;
  }

  return (
    <instancedMesh args={[undefined, undefined, attributes.count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]}>
        <instancedBufferAttribute args={[attributes.offset, 3]} attach="attributes-aOffset" />
        <instancedBufferAttribute args={[attributes.size, 2]} attach="attributes-aSize" />
        <instancedBufferAttribute args={[attributes.color, 3]} attach="attributes-aColor" />
        <instancedBufferAttribute args={[attributes.layer, 2]} attach="attributes-aLayer" />
      </planeGeometry>
      <rawShaderMaterial fragmentShader={fragmentShader} glslVersion={GLSL3} vertexShader={vertexShader} />
    </instancedMesh>
  );
};

export default Billboards;
