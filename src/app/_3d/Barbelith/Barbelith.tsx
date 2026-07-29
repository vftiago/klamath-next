import { useFrame } from "@react-three/fiber";
import type React from "react";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { Mesh, RawShaderMaterial } from "three";
import { getSceneTime } from "../utils";
import fragmentShader from "./barbelith.frag";
import vertexShader from "./barbelith.vert";

const Barbelith = (props: React.JSX.IntrinsicElements["mesh"]) => {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<RawShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      rotate: { value: 4 },
      time: { value: 0 },
    }),
    [],
  );

  useLayoutEffect(() => {
    meshRef.current?.rotation.set((90 * Math.PI) / 180, 1, 1);
  }, []);

  useFrame(() => {
    const materialUniforms = materialRef.current?.uniforms;

    if (materialUniforms) {
      materialUniforms.time.value = getSceneTime();
    }
  });

  return (
    <mesh {...props} ref={meshRef}>
      <sphereGeometry args={[192, 32, 32]} />
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

export default Barbelith;
