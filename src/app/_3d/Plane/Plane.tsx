import { useFrame } from "@react-three/fiber";
import type React from "react";
import { useLayoutEffect, useRef } from "react";
import type { Mesh, RawShaderMaterial } from "three";
import { TIME_SPEED } from "../constants";
import fragmentShader from "./plane.frag";
import vertexShader from "./plane.vert";

const PLANE_DIMENSIONS = 1024;

const Plane = (props: React.JSX.IntrinsicElements["mesh"]) => {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<RawShaderMaterial>(null);

  useLayoutEffect(() => {
    if (!meshRef.current || !materialRef.current) {
      return;
    }

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
    <mesh {...props} ref={meshRef}>
      <planeGeometry args={[PLANE_DIMENSIONS, PLANE_DIMENSIONS, PLANE_DIMENSIONS / 32, PLANE_DIMENSIONS / 32]} />
      <rawShaderMaterial
        fragmentShader={fragmentShader}
        lights={false}
        ref={materialRef}
        transparent={true}
        vertexShader={vertexShader}
        wireframe={true}
      />
    </mesh>
  );
};

export default Plane;
