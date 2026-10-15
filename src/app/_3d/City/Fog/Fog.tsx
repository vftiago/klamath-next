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
};

type FogPlaneProps = {
  groundY: number;
  layer: CityLayer;
  nextZ: number;
  texture: CanvasTexture;
};

/** The fog tile keeps the reference's aspect: a tile is 1024/200 times wider than it is tall. */
const TILE_ASPECT = FOG_TILE_WIDTH / FOG_TILE_HEIGHT;

const FogPlane = ({ groundY, layer, nextZ, texture }: FogPlaneProps) => {
  const materialRef = useRef<RawShaderMaterial>(null);

  // bottom 32% of the skyline, dipping 10 reference px below the ground line, sitting in front of its layer
  const height = 0.32 * layer.skylineHeight;
  const bottom = groundY - 10 * layer.scale;
  const z = layer.z + 0.35 * (nextZ - layer.z);
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

/** Drifting purple fog between the layers, one scrolling textured plane per layer that has fog. */
const Fog = ({ layout }: FogProps) => {
  // DOM work (a canvas) belongs in a state initializer, not render
  const [texture] = useState(() => createFogTexture());

  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);

  return (
    <group>
      {layout.layers.map((layer, i) =>
        layer.config.fog > 0 ? (
          <FogPlane
            groundY={layout.groundY}
            key={layer.index}
            layer={layer}
            nextZ={layout.layers[i + 1]?.z ?? layer.z + 100}
            texture={texture}
          />
        ) : null,
      )}
    </group>
  );
};

export default Fog;
