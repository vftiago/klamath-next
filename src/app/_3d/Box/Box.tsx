import { useFrame } from "@react-three/fiber";
import type React from "react";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { Mesh, RawShaderMaterial } from "three";
import { getSceneTime } from "../utils";
import fragmentShader from "./box.frag";
import vertexShader from "./box.vert";

const Box = (props: React.JSX.IntrinsicElements["mesh"]) => {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<RawShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      rotate: { value: 0 },
      time: { value: 0 },
    }),
    [],
  );

  useLayoutEffect(() => {
    meshRef.current?.rotation.set((90 * Math.PI) / 180, 1, 1);
  }, []);

  useFrame(() => {
    const materialUniforms = materialRef.current?.uniforms;

    if (!materialUniforms) {
      return;
    }

    // rotate starts at the 0 sentinel; randomize it on the first frame, where impure code is allowed
    if (materialUniforms.rotate.value === 0) {
      materialUniforms.rotate.value = Math.random() * 10;
    }

    materialUniforms.time.value = getSceneTime();
  });

  return (
    <mesh {...props} ref={meshRef}>
      <boxGeometry args={[100, 100, 100]} />
      <rawShaderMaterial
        fragmentShader={fragmentShader}
        ref={materialRef}
        transparent={true}
        uniforms={uniforms}
        vertexShader={vertexShader}
        wireframe={true}
      />
    </mesh>
  );
};

export default Box;
