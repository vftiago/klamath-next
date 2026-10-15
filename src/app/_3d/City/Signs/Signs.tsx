import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { InstancedBufferAttribute } from "three";
import { DynamicDrawUsage, GLSL3, Vector2 } from "three";
import { getSceneTime } from "../../utils";
import type { CityLayout, Sign } from "../generate";
import { SIGN_DIM_BY_LAYER } from "../generate";
import type { TextAtlas } from "../text-atlas";
import { glyphIndex } from "../text-atlas";
import fragmentShader from "./sign.frag";
import vertexShader from "./sign.vert";

type SignsProps = {
  atlas: TextAtlas;
  /** Run the flicker state machine; false holds every sign steady at full brightness. */
  flicker?: boolean;
  layout: CityLayout;
};

/** Characters per sign the shader supports (three vec4 attributes). */
const MAX_CHARS = 12;

type SignMode = "brown" | "dropout" | "ok" | "stutter";

/** Mutable per-sign driver state, advanced every frame by the reference's state machine. */
type SignDriver = {
  flaky: boolean;
  glyphCount: number;
  level: number;
  mode: SignMode;
  offGlyph: number;
  offUntil: number;
  phase: number;
  until: number;
};

type SignAttributes = {
  color: Float32Array;
  count: number;
  drivers: SignDriver[];
  glyphs0: Float32Array;
  glyphs1: Float32Array;
  glyphs2: Float32Array;
  meta: Float32Array;
  offset: Float32Array;
  params: Float32Array;
  size: Float32Array;
  state: Float32Array;
};

/** Neon palette slots, weighted like the reference: pink, cyan, lime, pink, cyan. */
const NEON_SLOTS = [
  [255, 45, 170],
  [40, 235, 255],
  [214, 255, 40],
  [255, 45, 170],
  [40, 235, 255],
].map((rgb) => rgb.map((c) => c / 255));

const STEADY_LEVEL = 0.95;

const buildAttributes = (layout: CityLayout, atlas: TextAtlas): SignAttributes => {
  const entries: { layerIndex: number; scale: number; sign: Sign; z: number }[] = [];

  for (const layer of layout.layers) {
    for (const sign of layer.signs) {
      entries.push({ layerIndex: layer.index, scale: layer.scale, sign, z: layer.z });
    }
  }

  const count = entries.length;
  const attributes: SignAttributes = {
    color: new Float32Array(count * 3),
    count,
    drivers: [],
    glyphs0: new Float32Array(count * 4),
    glyphs1: new Float32Array(count * 4),
    glyphs2: new Float32Array(count * 4),
    meta: new Float32Array(count * 3),
    offset: new Float32Array(count * 3),
    params: new Float32Array(count * 4),
    size: new Float32Array(count * 2),
    state: new Float32Array(count * 2),
  };

  entries.forEach(({ layerIndex, scale, sign, z }, i) => {
    attributes.offset.set([sign.x, layout.groundY + sign.y, z + sign.z], i * 3);
    attributes.size.set([sign.width, sign.height], i * 2);
    attributes.color.set(NEON_SLOTS[sign.colorSlot] ?? NEON_SLOTS[0], i * 3);
    const chars = [...sign.text].slice(0, MAX_CHARS);
    attributes.params.set([sign.cell, sign.margin, sign.vertical ? 1 : 0, chars.length], i * 4);
    const glyphs = Array.from({ length: MAX_CHARS }, (_, c) => (chars[c] ? glyphIndex(atlas, chars[c]) : 0));
    attributes.glyphs0.set(glyphs.slice(0, 4), i * 4);
    attributes.glyphs1.set(glyphs.slice(4, 8), i * 4);
    attributes.glyphs2.set(glyphs.slice(8, 12), i * 4);
    attributes.meta.set([SIGN_DIM_BY_LAYER[layerIndex] ?? 1, sign.dead, scale], i * 3);
    attributes.state.set([STEADY_LEVEL, -1], i * 2);
    attributes.drivers.push({
      flaky: sign.flaky,
      glyphCount: chars.length,
      level: 1,
      mode: "ok",
      offGlyph: -1,
      offUntil: 0,
      phase: sign.phase,
      until: 0,
    });
  });

  return attributes;
};

/**
 * The reference's sign driver. Every sign is "ok" most of the time, easing toward a gently humming level;
 * flaky signs occasionally stutter, drop out or brown out, and may blank a single glyph for a moment.
 * Times are in seconds.
 */
const advanceDriver = (driver: SignDriver, now: number) => {
  if (now > driver.until) {
    const roll = Math.random();

    if (!driver.flaky || roll < 0.72) {
      driver.mode = "ok";
      driver.until = now + 2 + 7 * Math.random();
      if (driver.flaky && Math.random() < 0.4) {
        driver.offGlyph = Math.floor(Math.random() * driver.glyphCount);
        driver.offUntil = now + 0.09 + 0.38 * Math.random();
      }
    } else if (roll < 0.84) {
      driver.mode = "stutter";
      driver.until = now + 0.25 + 0.7 * Math.random();
    } else if (roll < 0.93) {
      driver.mode = "dropout";
      driver.until = now + 0.08 + 0.45 * Math.random();
    } else {
      driver.mode = "brown";
      driver.until = now + 1.5 + 2.8 * Math.random();
    }
  }

  if (driver.mode === "stutter") {
    driver.level = Math.random() < 0.45 ? 0.05 : 1;
  } else if (driver.mode === "dropout") {
    driver.level = 0.03;
  } else {
    const target =
      driver.mode === "brown"
        ? 0.32 + 0.08 * Math.sin(6 * now + driver.phase)
        : 0.93 + 0.05 * Math.sin(38 * now + driver.phase);
    driver.level += (target - driver.level) * 0.08;
  }
};

/** Neon signs on every layer: one instanced quad draw, characters from the shared text atlas, per-sign flicker. */
const Signs = ({ atlas, flicker = true, layout }: SignsProps) => {
  const stateAttributeRef = useRef<InstancedBufferAttribute>(null);
  const attributes = useMemo(() => buildAttributes(layout, atlas), [atlas, layout]);
  const uniforms = useMemo(
    () => ({ uAtlas: { value: atlas.texture }, uAtlasGrid: { value: new Vector2(atlas.columns, atlas.rows) } }),
    [atlas],
  );

  useFrame(() => {
    const stateAttribute = stateAttributeRef.current;

    if (!stateAttribute) {
      return;
    }

    const now = getSceneTime();
    const { drivers, state } = attributes;

    drivers.forEach((driver, i) => {
      if (flicker) {
        advanceDriver(driver, now);
        state[i * 2] = driver.level;
        state[i * 2 + 1] = now < driver.offUntil ? driver.offGlyph : -1;
      } else {
        state[i * 2] = STEADY_LEVEL;
        state[i * 2 + 1] = -1;
      }
    });

    stateAttribute.needsUpdate = true;
  });

  if (attributes.count === 0) {
    return null;
  }

  return (
    <instancedMesh args={[undefined, undefined, attributes.count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]}>
        <instancedBufferAttribute args={[attributes.offset, 3]} attach="attributes-aOffset" />
        <instancedBufferAttribute args={[attributes.size, 2]} attach="attributes-aSize" />
        <instancedBufferAttribute args={[attributes.color, 3]} attach="attributes-aColor" />
        <instancedBufferAttribute args={[attributes.params, 4]} attach="attributes-aParams" />
        <instancedBufferAttribute args={[attributes.glyphs0, 4]} attach="attributes-aGlyphs0" />
        <instancedBufferAttribute args={[attributes.glyphs1, 4]} attach="attributes-aGlyphs1" />
        <instancedBufferAttribute args={[attributes.glyphs2, 4]} attach="attributes-aGlyphs2" />
        <instancedBufferAttribute args={[attributes.meta, 3]} attach="attributes-aMeta" />
        <instancedBufferAttribute
          args={[attributes.state, 2]}
          attach="attributes-aState"
          ref={stateAttributeRef}
          usage={DynamicDrawUsage}
        />
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

export default Signs;
