import React, { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, RawShaderMaterial } from "three";

import { TIME_SPEED } from "../constants";

import fragmentShader from "./barbelith.frag";
import vertexShader from "./barbelith.vert";

const Barbelith = (props: React.JSX.IntrinsicElements["mesh"]) => {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<RawShaderMaterial>(null);

  useLayoutEffect(() => {
    if (!meshRef.current || !materialRef.current) {
      return;
    }

    meshRef.current.rotation.set((90 * Math.PI) / 180, 1, 1);

    const uniforms = materialRef.current.uniforms;

    uniforms.rotate = { value: 4 };

    uniforms.time = {
      value: 0,
    };
  }, []);

  useFrame((_, delta) => {
    if (!materialRef.current) {
      return;
    }

    const uniforms = materialRef.current.uniforms;

    uniforms.time.value += delta * TIME_SPEED;
  });

  return (
    <mesh {...props} ref={meshRef}>
      <sphereGeometry args={[200, 32, 32]} />
      <rawShaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        wireframe={true}
      />
    </mesh>
  );
};

export default Barbelith;
