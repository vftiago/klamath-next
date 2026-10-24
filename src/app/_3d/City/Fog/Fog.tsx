import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CanvasTexture, RawShaderMaterial } from "three";
import { GLSL3 } from "three";
import { getSceneTime } from "../../utils";
import type { CityLayer, CityLayout } from "../generate";
import { createFogTexture, FOG_TILE_HEIGHT, FOG_TILE_WIDTH } from "./fog-texture";
import fragmentShader from "./fog.frag";
import vertexShader from "./fog.vert";

type FogProps = {
  layout: CityLayout;
  /** How many fog planes to draw, nearest layers first. */
  planes?: number;
};

type FogPlaneProps = {
  groundY: number;
  layer: CityLayer;
  texture: CanvasTexture;
  /** World z of the plane: the middle of the street ahead of the row. */
  z: number;
};

/** The fog tile keeps the reference's aspect: a tile is 1024/200 times wider than it is tall. */
const TILE_ASPECT = FOG_TILE_WIDTH / FOG_TILE_HEIGHT;

const FogPlane = ({ groundY, layer, texture, z }: FogPlaneProps) => {
  const materialRef = useRef<RawShaderMaterial>(null);

  // bottom 32% of the skyline, dipping 10 reference px below the ground line
  const height = 0.32 * layer.skylineHeight;
  const bottom = groundY - 10 * layer.scale;
  const tileWidth = height * TILE_ASPECT;
  const repeat = layer.span / tileWidth;
  // reference scroll speed: 5 + 4 * layer px/s
  const scrollSpeed = ((5 + 4 * layer.index) * layer.scale) / tileWidth;

  const uniforms = useMemo(
    () => ({
      uAlpha: { value: layer.config.fog },
      uMap: { value: texture },
      uRepeat: { value: repeat },
      uScroll: { value: 0 },
    }),
    [layer.config.fog, repeat, texture],
  );

  useFrame(() => {
    const materialUniforms = materialRef.current?.uniforms;

    if (!materialUniforms) {
      return;
    }

    materialUniforms.uScroll.value = -(getSceneTime() * scrollSpeed) % 1;
  });

  return (
    <mesh frustumCulled={false} position={[0, bottom + height / 2, z]}>
      <planeGeometry args={[layer.span, height]} />
      <rawShaderMaterial
        depthWrite={false}
        fragmentShader={fragmentShader}
        glslVersion={GLSL3}
        ref={materialRef}
        transparent={true}
        uniforms={uniforms}
        vertexShader={vertexShader}
      />
    </mesh>
  );
};

/** Drifting purple fog in the streets between the rows: one scrolling textured plane per street, mid-street. */
const Fog = ({ layout, planes = Infinity }: FogProps) => {
  // DOM work (a canvas) belongs in a state initializer, not render
  const [texture] = useState(() => createFogTexture());

  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);

  // the nearest streets matter most, so a reduced count drops the far ones; the nearest row has no street ahead
  const foggy = layout.layers.filter((layer) => layer.config.fogZ !== null && layer.config.fog > 0);
  const shown = foggy.slice(Math.max(0, foggy.length - planes));

  return (
    <group>
      {shown.map((layer) => (
        <FogPlane
          groundY={layout.groundY}
          key={layer.index}
          layer={layer}
          texture={texture}
          z={layer.config.fogZ ?? layer.z}
        />
      ))}
    </group>
  );
};

export default Fog;
