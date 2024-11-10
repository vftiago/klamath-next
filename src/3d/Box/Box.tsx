import React, { useLayoutEffect , useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { TIME_SPEED } from "../constants";

import fragmentShader from "./box.frag";
import vertexShader from "./box.vert";

const Box = (props: React.JSX.IntrinsicElements["mesh"]) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.RawShaderMaterial>(null);

  useLayoutEffect(() => {
    if (!meshRef.current || !materialRef.current) {
      return;
    }

    meshRef.current.rotation.set((90 * Math.PI) / 180, 1, 1);

    const uniforms = materialRef.current.uniforms;

    uniforms.rotate = { value: Math.random() * 10 };

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
      <boxGeometry args={[100, 100, 100]} />
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

export default Box;
