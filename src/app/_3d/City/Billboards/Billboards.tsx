import { useMemo } from "react";
import { GLSL3, Vector2 } from "three";
import { NEAREST_LAYER } from "../config";
import type { CityLayout } from "../generate";
import type { TextAtlas } from "../text-atlas";
import { glyphIndex } from "../text-atlas";
import fragmentShader from "./billboard.frag";
import vertexShader from "./billboard.vert";

type BillboardsProps = {
  atlas: TextAtlas;
  layout: CityLayout;
};

type BillboardAttributes = {
  color: Float32Array;
  count: number;
  glyphs0: Float32Array;
  glyphs1: Float32Array;
  glyphs2: Float32Array;
  layer: Float32Array;
  offset: Float32Array;
  size: Float32Array;
};

/** Characters per board the shader supports (three vec4 attributes). */
const MAX_CHARS = 12;

/** Neon palette slots, weighted like the reference: pink, cyan, lime, pink, cyan. */
const NEON_SLOTS = [
  [255, 45, 170],
  [40, 235, 255],
  [214, 255, 40],
  [255, 45, 170],
  [40, 235, 255],
].map((rgb) => rgb.map((c) => c / 255));

const buildAttributes = (layout: CityLayout, atlas: TextAtlas): BillboardAttributes => {
  const count = layout.layers.reduce((sum, layer) => sum + layer.billboards.length, 0);
  const attributes: BillboardAttributes = {
    color: new Float32Array(count * 3),
    count,
    glyphs0: new Float32Array(count * 4),
    glyphs1: new Float32Array(count * 4),
    glyphs2: new Float32Array(count * 4),
    layer: new Float32Array(count * 3),
    offset: new Float32Array(count * 3),
    size: new Float32Array(count * 2),
  };

  let i = 0;
  for (const layer of layout.layers) {
    for (const board of layer.billboards) {
      attributes.offset.set([board.x, layout.groundY + board.y, layer.z + board.z], i * 3);
      attributes.size.set([board.width, board.height], i * 2);
      attributes.color.set(NEON_SLOTS[board.colorSlot] ?? NEON_SLOTS[0], i * 3);
      const chars = [...board.text].slice(0, MAX_CHARS);
      attributes.layer.set([layer.index / NEAREST_LAYER, layer.scale, chars.length], i * 3);
      const glyphs = Array.from({ length: MAX_CHARS }, (_, c) => (chars[c] ? glyphIndex(atlas, chars[c]) : 0));
      attributes.glyphs0.set(glyphs.slice(0, 4), i * 4);
      attributes.glyphs1.set(glyphs.slice(4, 8), i * 4);
      attributes.glyphs2.set(glyphs.slice(8, 12), i * 4);
      i++;
    }
  }

  return attributes;
};

/** Rooftop billboards: instanced quads with a neon frame and a slogan from the text atlas, all layers in one draw. */
const Billboards = ({ atlas, layout }: BillboardsProps) => {
  const attributes = useMemo(() => buildAttributes(layout, atlas), [atlas, layout]);
  const uniforms = useMemo(
    () => ({ uAtlas: { value: atlas.texture }, uAtlasGrid: { value: new Vector2(atlas.columns, atlas.rows) } }),
    [atlas],
  );

  if (attributes.count === 0) {
    return null;
  }

  return (
    <instancedMesh args={[undefined, undefined, attributes.count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]}>
        <instancedBufferAttribute args={[attributes.offset, 3]} attach="attributes-aOffset" />
        <instancedBufferAttribute args={[attributes.size, 2]} attach="attributes-aSize" />
        <instancedBufferAttribute args={[attributes.color, 3]} attach="attributes-aColor" />
        <instancedBufferAttribute args={[attributes.layer, 3]} attach="attributes-aLayer" />
        <instancedBufferAttribute args={[attributes.glyphs0, 4]} attach="attributes-aGlyphs0" />
        <instancedBufferAttribute args={[attributes.glyphs1, 4]} attach="attributes-aGlyphs1" />
        <instancedBufferAttribute args={[attributes.glyphs2, 4]} attach="attributes-aGlyphs2" />
      </planeGeometry>
      <rawShaderMaterial
        fragmentShader={fragmentShader}
        glslVersion={GLSL3}
        uniforms={uniforms}
        vertexShader={vertexShader}
      />
    </instancedMesh>
  );
};

export default Billboards;
