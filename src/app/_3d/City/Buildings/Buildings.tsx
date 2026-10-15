import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { RawShaderMaterial } from "three";
import { GLSL3, Vector4 } from "three";
import { getSceneTime } from "../../utils";
import { NEAREST_LAYER } from "../config";
import type { CityLayer, CityLayout } from "../generate";
import fragmentShader from "./building.frag";
import vertexShader from "./building.vert";

type BuildingsProps = {
  /** Advance the window toggle clock; false freezes the lit pattern. */
  animate?: boolean;
  layer: CityLayer;
  layout: CityLayout;
};

type InstanceAttributes = {
  blank: Float32Array;
  frame: Float32Array;
  offset: Float32Array;
  pattern: Float32Array;
  rands: Float32Array;
  seed: Float32Array;
  size: Float32Array;
};

/** Window pattern value that tells the shader to draw a plain box (roof furniture). */
const PLAIN_PATTERN = 3;

const buildAttributes = (layer: CityLayer, groundY: number): InstanceAttributes => {
  const count = layer.buildings.length + layer.details.length;
  const attributes: InstanceAttributes = {
    blank: new Float32Array(count * 2).fill(-1),
    frame: new Float32Array(count),
    offset: new Float32Array(count * 3),
    pattern: new Float32Array(count),
    rands: new Float32Array(count * 4),
    seed: new Float32Array(count),
    size: new Float32Array(count * 3),
  };

  layer.buildings.forEach((building, i) => {
    attributes.offset.set([building.x, groundY, layer.z], i * 3);
    attributes.size.set([building.width, building.height, building.depth], i * 3);
    attributes.rands.set(building.rands, i * 4);
    attributes.seed[i] = building.seed;
    attributes.pattern[i] = building.pattern;
    attributes.frame[i] = building.frame ? 1 : 0;
    if (building.blank) {
      attributes.blank.set(building.blank, i * 2);
    }
  });

  layer.details.forEach((detail, j) => {
    const i = layer.buildings.length + j;
    attributes.offset.set([detail.x, groundY + detail.baseY, layer.z + (detail.z ?? 0)], i * 3);
    attributes.size.set([detail.width, detail.height, detail.depth], i * 3);
    attributes.pattern[i] = detail.pattern ?? PLAIN_PATTERN;
  });

  return attributes;
};

/**
 * One instanced draw per depth layer. Buildings are unit boxes scaled and placed per instance in the
 * vertex shader; windows, wash, haze and detail lines are all computed in the fragment shader.
 *
 * Remounted (via key) when the layout changes, so uniforms and attributes are created once per mount.
 */
const Buildings = ({ animate = true, layer, layout }: BuildingsProps) => {
  const materialRef = useRef<RawShaderMaterial>(null);

  const attributes = useMemo(() => buildAttributes(layer, layout.groundY), [layer, layout.groundY]);

  const uniforms = useMemo(() => {
    const { config, index, scale } = layer;
    const isNear = index === NEAREST_LAYER;
    const [cellW, gapX, cellH, gapY] = config.win;

    return {
      uBottomReserve: { value: (isNear ? 52 : 4) * scale },
      uCell: { value: new Vector4(cellW * scale, gapX * scale, cellH * scale, gapY * scale) },
      uEdgeLine: { value: index >= 2 ? 1 : 0 },
      uFloorLines: { value: index >= NEAREST_LAYER - 1 ? 1 : 0 },
      uGlow: { value: config.glow },
      uGlowPad: { value: index >= NEAREST_LAYER - 1 ? 2 * scale : 0 },
      uGround: { value: layout.groundY },
      uHaze: { value: config.haze },
      uIsNear: { value: isNear ? 1 : 0 },
      uLayer: { value: index },
      uLit: { value: config.lit },
      uMargin: { value: (3 + index) * scale },
      uPx: { value: scale },
      uR: { value: index / NEAREST_LAYER },
      uSideLines: { value: config.side >= 0.5 ? 1 : 0 },
      uSkylineH: { value: layer.skylineHeight },
      uTime: { value: 0 },
      uTop: { value: config.top },
    };
  }, [layer, layout.groundY]);

  useFrame(() => {
    const materialUniforms = materialRef.current?.uniforms;

    if (!materialUniforms) {
      return;
    }

    if (animate) {
      materialUniforms.uTime.value = getSceneTime();
    }
  });

  return (
    <instancedMesh args={[undefined, undefined, layer.buildings.length + layer.details.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]}>
        <instancedBufferAttribute args={[attributes.offset, 3]} attach="attributes-aOffset" />
        <instancedBufferAttribute args={[attributes.size, 3]} attach="attributes-aSize" />
        <instancedBufferAttribute args={[attributes.seed, 1]} attach="attributes-aSeed" />
        <instancedBufferAttribute args={[attributes.pattern, 1]} attach="attributes-aPattern" />
        <instancedBufferAttribute args={[attributes.frame, 1]} attach="attributes-aFrame" />
        <instancedBufferAttribute args={[attributes.rands, 4]} attach="attributes-aRands" />
        <instancedBufferAttribute args={[attributes.blank, 2]} attach="attributes-aBlank" />
      </boxGeometry>
      <rawShaderMaterial
        fragmentShader={fragmentShader}
        glslVersion={GLSL3}
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
      />
    </instancedMesh>
  );
};

export default Buildings;
