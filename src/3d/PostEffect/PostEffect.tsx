import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, RawShaderMaterial, Scene, Vector2, WebGLRenderTarget } from "three";

import { TIME_SPEED } from "../constants";

import fragmentShader from "./post-effect.frag";
import vertexShader from "./post-effect.vert";

const PostEffect = () => {
  const rawShaderMaterialRef = useRef<RawShaderMaterial>(null);
  const meshRef = useRef<Mesh>(null);

  const target = useMemo(() => {
    return new WebGLRenderTarget(window.innerWidth, window.innerHeight);
  }, []);

  const [scene] = useState(() => new Scene());

  const handleWindowResize = useCallback(() => {
    if (!rawShaderMaterialRef.current) {
      return;
    }

    target.setSize(window.innerWidth, window.innerHeight);

    rawShaderMaterialRef.current.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
  }, [target]);

  useLayoutEffect(() => {
    if (!rawShaderMaterialRef.current) {
      return;
    }

    window.addEventListener("resize", handleWindowResize);

    const uniforms = rawShaderMaterialRef.current.uniforms;

    uniforms.resolution = {
      value: new Vector2(window.innerWidth, window.innerHeight),
    };

    uniforms.texture = {
      value: target.texture,
    };

    uniforms.time = {
      value: 0,
    };

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [handleWindowResize, target.texture]);

  useFrame((state, delta) => {
    if (!rawShaderMaterialRef.current || !meshRef.current) {
      return;
    }

    const uniforms = rawShaderMaterialRef.current.uniforms;

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
