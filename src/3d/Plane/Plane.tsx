import React, { useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import fragmentShader from "./plane.frag";
import vertexShader from "./plane.vert";
import { TIME_SPEED } from "../constants";
import * as THREE from "three";

const PLANE_DIMENSIONS = 1024;

const Plane = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.RawShaderMaterial>(null);

  useLayoutEffect(() => {
    if (!meshRef.current || !materialRef.current) {
      return;
    }

    meshRef.current.position.set(0, -192, 128);
    meshRef.current.rotation.set((-90 * Math.PI) / 180, 0, 0);

    const uniforms = materialRef.current.uniforms;

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
    <mesh ref={meshRef}>
      <planeGeometry args={[PLANE_DIMENSIONS, PLANE_DIMENSIONS, PLANE_DIMENSIONS / 32, PLANE_DIMENSIONS / 32]} />
      <rawShaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        wireframe={true}
        lights={false}
      />
    </mesh>
  );
};

export default Plane;
