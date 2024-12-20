import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, RawShaderMaterial, Scene, Vector2, WebGLRenderTarget } from "three";

import { TIME_SPEED } from "../constants";

import fragmentShader from "./post-effect.frag";
import vertexShader from "./post-effect.vert";

const PostEffect = () => {
  const rawShaderMaterialRef = useRef<RawShaderMaterial>(null);
  const meshRef = useRef<Mesh>(null);

  const targetRef = useRef<WebGLRenderTarget | null>(null);

  const [scene] = useState(() => new Scene());

  const [dimensions, setDimensions] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  const initRenderTarget = useCallback(() => {
    if (targetRef.current) {
      targetRef.current.dispose();
    }

    targetRef.current = new WebGLRenderTarget(dimensions.width, dimensions.height);

    if (rawShaderMaterialRef.current) {
      rawShaderMaterialRef.current.uniforms.resolution.value.set(dimensions.width, dimensions.height);
      rawShaderMaterialRef.current.uniforms.texture.value = targetRef.current.texture;
    }
  }, [dimensions]);

  const handleWindowResize = useCallback(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useLayoutEffect(() => {
    if (!rawShaderMaterialRef.current) {
      return;
    }

    const uniforms = rawShaderMaterialRef.current.uniforms;

    uniforms.resolution = {
      value: new Vector2(window.innerWidth, window.innerHeight),
    };

    uniforms.time = {
      value: 0,
    };

    uniforms.texture = {
      value: null,
    };

    initRenderTarget();

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      if (targetRef.current) {
        targetRef.current.dispose();
      }
    };
  }, [dimensions, handleWindowResize, initRenderTarget]);

  useFrame((state, delta) => {
    if (!rawShaderMaterialRef.current || !meshRef.current || !targetRef.current) {
      return;
    }

    const uniforms = rawShaderMaterialRef.current.uniforms;
    const target = targetRef.current;

    meshRef.current.position.set(0, state.camera.position.y, 0);

    uniforms.time.value += delta * TIME_SPEED;

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
      <rawShaderMaterial ref={rawShaderMaterialRef} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
};

export default PostEffect;
