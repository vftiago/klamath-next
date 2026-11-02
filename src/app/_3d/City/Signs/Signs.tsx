import type { ThreeEvent } from "@react-three/fiber";
import { useFrame, useThree } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { InstancedBufferAttribute, InstancedMesh } from "three";
import { DynamicDrawUsage, GLSL3, Matrix4, Vector2 } from "three";
import { getSceneTime } from "../../utils";
import type { CityLayout, Sign, SignHover, SignLook } from "../generate";
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
  backing: Float32Array;
  color: Float32Array;
  count: number;
  drivers: SignDriver[];
  glyphs0: Float32Array;
  glyphs1: Float32Array;
  glyphs2: Float32Array;
  /** Where each sign links to, per instance; set on the frame signs only. */
  hrefs: (string | undefined)[];
  /** Sign id per instance, so a pointer hit on `instanceId` maps back to its sign (and route). */
  ids: string[];
  /** Each sign's resting look and, for the frame signs, the look swapped in while hovered. */
  looks: { base: SignLook; hover: null | SignHover }[];
  meta: Float32Array;
  offset: Float32Array;
  params: Float32Array;
  /** Border core, border halo and text brightness, and the border width, per instance. */
  shine: Float32Array;
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

/** Page controls drawn over the scene; the pointer belongs to them, not to a sign behind them. */
const PAGE_CONTROLS = "a, button, input, label, select, summary, textarea, [role='button'], [role='link']";

const isOverPageControl = (target: EventTarget | null) =>
  target instanceof Element && target.closest(PAGE_CONTROLS) !== null;

const buildAttributes = (layout: CityLayout, atlas: TextAtlas): SignAttributes => {
  const entries: { scale: number; sign: Sign; z: number }[] = [];

  for (const layer of layout.layers) {
    for (const sign of layer.signs) {
      entries.push({ scale: layer.scale, sign, z: layer.z });
    }
  }

  const count = entries.length;
  const attributes: SignAttributes = {
    backing: new Float32Array(count * 3),
    color: new Float32Array(count * 3),
    count,
    drivers: [],
    glyphs0: new Float32Array(count * 4),
    glyphs1: new Float32Array(count * 4),
    glyphs2: new Float32Array(count * 4),
    hrefs: entries.map(({ sign }) => sign.href),
    ids: entries.map(({ sign }) => sign.id),
    looks: [],
    meta: new Float32Array(count * 4),
    offset: new Float32Array(count * 3),
    params: new Float32Array(count * 4),
    shine: new Float32Array(count * 4),
    size: new Float32Array(count * 2),
    state: new Float32Array(count * 2),
  };

  entries.forEach(({ scale, sign, z }, i) => {
    attributes.offset.set([sign.x, layout.groundY + sign.y, z + sign.z], i * 3);
    attributes.size.set([sign.width, sign.height], i * 2);
    attributes.color.set(NEON_SLOTS[sign.colorSlot] ?? NEON_SLOTS[0], i * 3);
    attributes.backing.set(sign.backing, i * 3);
    const chars = [...sign.text].slice(0, MAX_CHARS);
    attributes.params.set([sign.cell, sign.margin, sign.vertical ? 1 : 0, chars.length], i * 4);
    const glyphs = Array.from({ length: MAX_CHARS }, (_, c) => (chars[c] ? glyphIndex(atlas, chars[c]) : 0));
    attributes.glyphs0.set(glyphs.slice(0, 4), i * 4);
    attributes.glyphs1.set(glyphs.slice(4, 8), i * 4);
    attributes.glyphs2.set(glyphs.slice(8, 12), i * 4);
    attributes.meta.set([sign.dim, sign.dead, scale, sign.radius], i * 4);
    const { borderCore, borderHalo, text } = sign.brightness;
    attributes.shine.set([borderCore, borderHalo, text, sign.borderWidth], i * 4);
    attributes.state.set([STEADY_LEVEL, -1], i * 2);
    const { backing, borderWidth, brightness, dim, radius } = sign;
    attributes.looks.push({ base: { backing, borderWidth, brightness, dim, radius }, hover: sign.hover });
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

/**
 * Neon signs on every layer: one instanced quad draw, characters from the shared text atlas, per-sign flicker.
 * The frame signs react to the pointer: the hovered one swaps to its `hover` look (backing, border, brightness,
 * radius) and holds steady while the pointer is over it, and a click follows its `href`. Page controls drawn
 * over a sign take the pointer instead.
 */
const Signs = ({ atlas, flicker = true, layout }: SignsProps) => {
  const meshRef = useRef<InstancedMesh>(null);
  const stateAttributeRef = useRef<InstancedBufferAttribute>(null);
  const backingAttributeRef = useRef<InstancedBufferAttribute>(null);
  const metaAttributeRef = useRef<InstancedBufferAttribute>(null);
  const shineAttributeRef = useRef<InstancedBufferAttribute>(null);
  /** Instance under the pointer, or -1. */
  const hoveredRef = useRef(-1);
  const invalidate = useThree((state) => state.invalidate);
  const router = useRouter();
  const attributes = useMemo(() => buildAttributes(layout, atlas), [atlas, layout]);
  const uniforms = useMemo(
    () => ({ uAtlas: { value: atlas.texture }, uAtlasGrid: { value: new Vector2(atlas.columns, atlas.rows) } }),
    [atlas],
  );

  // the shader places instances from aOffset / aSize and ignores instanceMatrix; the matrices exist only so the
  // raycaster sees each sign's box where it is drawn
  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    const matrix = new Matrix4();
    const { count, offset, size } = attributes;

    for (let i = 0; i < count; i++) {
      const width = size[i * 2] ?? 0;
      const height = size[i * 2 + 1] ?? 0;
      matrix
        .makeScale(width, height, 1)
        .setPosition((offset[i * 3] ?? 0) + width / 2, (offset[i * 3 + 1] ?? 0) + height / 2, offset[i * 3 + 2] ?? 0);
      mesh.setMatrixAt(i, matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [attributes]);

  // the pointer cursor is set on the body (the event source); put it back if the signs unmount mid-hover
  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
    };
  }, []);

  /** Writes a look into the hovered-swappable attributes of one instance, through the attributes' own arrays. */
  const writeLook = (i: number, look: SignLook) => {
    const backing = backingAttributeRef.current;
    const meta = metaAttributeRef.current;
    const shine = shineAttributeRef.current;

    if (!backing || !meta || !shine) {
      return;
    }

    backing.array.set(look.backing, i * 3);
    meta.array[i * 4] = look.dim;
    meta.array[i * 4 + 3] = look.radius;
    const { borderCore, borderHalo, text } = look.brightness;
    shine.array.set([borderCore, borderHalo, text, look.borderWidth], i * 4);
    backing.needsUpdate = true;
    meta.needsUpdate = true;
    shine.needsUpdate = true;
    invalidate();
  };

  const setHovered = (next: number) => {
    const previous = hoveredRef.current;

    if (previous === next) {
      return;
    }

    const previousLook = attributes.looks[previous];
    const nextLook = attributes.looks[next]?.hover;

    if (previousLook) {
      writeLook(previous, previousLook.base);
    }
    if (nextLook) {
      writeLook(next, nextLook);
    }

    hoveredRef.current = next;
    document.body.style.cursor = next >= 0 ? "pointer" : "";
  };

  /**
   * The sign instance under the pointer, or -1. The ray runs on through the signs behind a blade, and R3F
   * delivers an event once per instance crossed (and an out whenever any of them drops away), so handlers
   * resolve from the nearest of the sorted intersections rather than from the instance they were called for.
   */
  const pointedSign = (event: ThreeEvent<MouseEvent>) =>
    isOverPageControl(event.nativeEvent.target) ? -1 : (event.intersections[0]?.instanceId ?? -1);

  const onPointer = (event: ThreeEvent<PointerEvent>) => {
    const id = pointedSign(event);
    setHovered(attributes.looks[id]?.hover ? id : -1);
  };

  /** Internal routes go through the app router; external links, and modified clicks, open a new tab. */
  const onClick = (event: ThreeEvent<MouseEvent>) => {
    // handle the click once, not once per instance the ray crossed
    event.stopPropagation();
    const href = attributes.hrefs[pointedSign(event)];

    if (!href) {
      return;
    }

    const { ctrlKey, metaKey, shiftKey } = event.nativeEvent;

    if (href.startsWith("/") && !ctrlKey && !metaKey && !shiftKey) {
      router.push(href);
    } else {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  useFrame(() => {
    const stateAttribute = stateAttributeRef.current;

    if (!stateAttribute) {
      return;
    }

    const now = getSceneTime();
    const { drivers, looks, state } = attributes;
    const hovered = hoveredRef.current;

    drivers.forEach((driver, i) => {
      if (flicker) {
        advanceDriver(driver, now);
      }

      if (i === hovered && looks[i]?.hover?.steady) {
        state[i * 2] = 1;
        state[i * 2 + 1] = -1;
      } else if (flicker) {
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
    <instancedMesh
      args={[undefined, undefined, attributes.count]}
      frustumCulled={false}
      ref={meshRef}
      onClick={onClick}
      onPointerMove={onPointer}
      onPointerOut={onPointer}
      onPointerOver={onPointer}
    >
      <planeGeometry args={[1, 1]}>
        <instancedBufferAttribute args={[attributes.offset, 3]} attach="attributes-aOffset" />
        <instancedBufferAttribute args={[attributes.size, 2]} attach="attributes-aSize" />
        <instancedBufferAttribute args={[attributes.color, 3]} attach="attributes-aColor" />
        <instancedBufferAttribute
          args={[attributes.backing, 3]}
          attach="attributes-aBacking"
          ref={backingAttributeRef}
        />
        <instancedBufferAttribute args={[attributes.params, 4]} attach="attributes-aParams" />
        <instancedBufferAttribute args={[attributes.glyphs0, 4]} attach="attributes-aGlyphs0" />
        <instancedBufferAttribute args={[attributes.glyphs1, 4]} attach="attributes-aGlyphs1" />
        <instancedBufferAttribute args={[attributes.glyphs2, 4]} attach="attributes-aGlyphs2" />
        <instancedBufferAttribute args={[attributes.meta, 4]} attach="attributes-aMeta" ref={metaAttributeRef} />
        <instancedBufferAttribute args={[attributes.shine, 4]} attach="attributes-aShine" ref={shineAttributeRef} />
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
