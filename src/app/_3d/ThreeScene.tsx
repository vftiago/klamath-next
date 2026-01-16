"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { MathUtils, Vector3 } from "three";
import Barbelith from "./Barbelith/Barbelith";
import Box from "./Box/Box";
import Plane from "./Plane/Plane";
import PostEffect from "./PostEffect/PostEffect";

const PLANE_POSITION = new Vector3(0, -192, 128);
const BARBELITH_POSITION = new Vector3(250, 350, -500);

const CAMERA_STATES: Record<string, { lookAt: Vector3; position: Vector3 }> = {
  // Home: default forward view
  "/": {
    lookAt: new Vector3(0, 0, 0),
    position: new Vector3(0, 0, 1024),
  },
  // About: looking at Barbelith from the side
  "/about": {
    lookAt: BARBELITH_POSITION.clone(),
    position: new Vector3(400, 0, 400),
  },
  // Projects: top-down view of the plane
  "/projects": {
    lookAt: PLANE_POSITION.clone(),
    position: new Vector3(0, 600, 128),
  },
  // Repositories: angled view looking down at the boxes area
  "/repositories": {
    lookAt: new Vector3(-200, -800, 0),
    position: new Vector3(400, -200, 800),
  },
};

const DEFAULT_CAMERA_STATE = CAMERA_STATES["/"];

const LERP_SPEED = 5;

const CameraController = () => {
  const { camera } = useThree();
  const pathname = usePathname();

  const targetPosition = useRef(DEFAULT_CAMERA_STATE.position.clone());
  const targetLookAt = useRef(DEFAULT_CAMERA_STATE.lookAt.clone());
  const currentLookAt = useRef(DEFAULT_CAMERA_STATE.lookAt.clone());
  const scrollOffset = useRef(0);

  useEffect(() => {
    const state = CAMERA_STATES[pathname ?? "/"] ?? DEFAULT_CAMERA_STATE;
    targetPosition.current.copy(state.position);
    targetLookAt.current.copy(state.lookAt);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      scrollOffset.current = -window.scrollY / 4;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useFrame((_, delta) => {
    const lerpFactor = MathUtils.clamp(delta * LERP_SPEED, 0, 1);

    // eslint-disable-next-line react-hooks/immutability -- Three.js camera objects are intended to be mutated
    camera.position.x = MathUtils.lerp(camera.position.x, targetPosition.current.x, lerpFactor);
    camera.position.y = MathUtils.lerp(camera.position.y, targetPosition.current.y + scrollOffset.current, lerpFactor);
    camera.position.z = MathUtils.lerp(camera.position.z, targetPosition.current.z, lerpFactor);

    currentLookAt.current.x = MathUtils.lerp(currentLookAt.current.x, targetLookAt.current.x, lerpFactor);
    currentLookAt.current.y = MathUtils.lerp(
      currentLookAt.current.y,
      targetLookAt.current.y + scrollOffset.current,
      lerpFactor,
    );
    currentLookAt.current.z = MathUtils.lerp(currentLookAt.current.z, targetLookAt.current.z, lerpFactor);

    camera.lookAt(currentLookAt.current);
  });

  return null;
};

const ThreeScene = () => {
  return (
    <div className="abstract-bg fixed -z-10 h-screen w-full">
      <div className="dot-grid" />
      <Canvas
        camera={{
          far: 10000,
          fov: 45,
          near: 1,
          position: [0, 0, 1024],
        }}
        gl={{
          antialias: true,
        }}
      >
        <CameraController />
        <Barbelith position={[250, 350, -500]} />
        <Plane position={[0, -192, 128]} />
        <Box position={[400, -500, 200]}></Box>
        <Box position={[-350, -600, -5]}></Box>
        <Box position={[-150, -700, -150]}></Box>
        <Box position={[-500, -900, 0]}></Box>
        <Box position={[-100, -1200, -300]}></Box>
        <Box position={[100, -1100, 25]}></Box>
        <Box position={[150, -1500, -10]}></Box>
        <PostEffect />
      </Canvas>
    </div>
  );
};

export default ThreeScene;
