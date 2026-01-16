import { useFrame } from "@react-three/fiber";
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { Mesh, RawShaderMaterial } from "three";
import { Scene, Vector2, WebGLRenderTarget } from "three";
import { getSceneTime } from "../utils";
import fragmentShader from "./post-effect.frag";
import vertexShader from "./post-effect.vert";

const PostEffect = () => {
  const rawShaderMaterialRef = useRef<RawShaderMaterial>(null);
  const meshRef = useRef<Mesh>(null);

  const targetRef = useRef<null | WebGLRenderTarget>(null);
  const uniformsInitializedRef = useRef(false);

  const [scene] = useState(() => new Scene());

  const [dimensions, setDimensions] = useState(() => ({
    height: window.innerHeight,
    width: window.innerWidth,
  }));

  const initRenderTarget = useCallback(() => {
    if (targetRef.current) {
      targetRef.current.dispose();
    }

    targetRef.current = new WebGLRenderTarget(dimensions.width, dimensions.height);

    if (rawShaderMaterialRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Three.js uniforms are loosely typed
      rawShaderMaterialRef.current.uniforms.resolution.value.set(dimensions.width, dimensions.height);
      rawShaderMaterialRef.current.uniforms.texture.value = targetRef.current.texture;
    }
  }, [dimensions]);

  const handleWindowResize = useCallback(() => {
    setDimensions({
      height: window.innerHeight,
      width: window.innerWidth,
    });
  }, []);

  useLayoutEffect(() => {
    if (!rawShaderMaterialRef.current) {
      return;
    }

    const uniforms = rawShaderMaterialRef.current.uniforms;

    if (!uniformsInitializedRef.current) {
      uniforms.resolution = {
        value: new Vector2(window.innerWidth, window.innerHeight),
      };

      uniforms.time = {
        value: 0,
      };

      uniforms.texture = {
        value: null,
      };

      uniformsInitializedRef.current = true;
    }

    initRenderTarget();

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      if (targetRef.current) {
        targetRef.current.dispose();
      }
    };
  }, [dimensions, handleWindowResize, initRenderTarget]);

  useFrame((state) => {
    if (!rawShaderMaterialRef.current || !meshRef.current || !targetRef.current) {
      return;
    }

    const uniforms = rawShaderMaterialRef.current.uniforms;
    const target = targetRef.current;

    meshRef.current.position.set(0, state.camera.position.y, 0);

    uniforms.time.value = getSceneTime();

    rawShaderMaterialRef.current.visible = false;
    state.gl.setRenderTarget(target);
    state.gl.render(state.scene, state.camera);

    rawShaderMaterialRef.current.visible = true;
    state.gl.setRenderTarget(null);
    state.gl.render(scene, state.camera);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <rawShaderMaterial fragmentShader={fragmentShader} ref={rawShaderMaterialRef} vertexShader={vertexShader} />
    </mesh>
  );
};

export default PostEffect;
