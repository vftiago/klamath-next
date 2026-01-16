import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RawShaderMaterial,
  Scene,
  Vector2,
  WebGLRenderTarget,
} from "three";
import { getSceneTime } from "../utils";
import fragmentShader from "./post-effect.frag";
import vertexShader from "./post-effect.vert";

const PostEffect = () => {
  const { gl } = useThree();

  const targetRef = useRef<null | WebGLRenderTarget>(null);

  const [postScene] = useState(() => {
    const s = new Scene();
    const geometry = new PlaneGeometry(2, 2);
    const material = new RawShaderMaterial({
      fragmentShader,
      uniforms: {
        resolution: { value: new Vector2(window.innerWidth, window.innerHeight) },
        texture: { value: null },
        time: { value: 0 },
      },
      vertexShader,
    });
    const mesh = new Mesh(geometry, material);
    s.add(mesh);
    return { material, scene: s };
  });

  const [orthoCamera] = useState(() => new OrthographicCamera(-1, 1, 1, -1, 0, 1));

  const [dimensions, setDimensions] = useState(() => ({
    height: window.innerHeight,
    width: window.innerWidth,
  }));

  const initRenderTarget = useCallback(() => {
    if (targetRef.current) {
      targetRef.current.dispose();
    }

    targetRef.current = new WebGLRenderTarget(dimensions.width, dimensions.height);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Three.js uniforms are loosely typed
    postScene.material.uniforms.resolution.value.set(dimensions.width, dimensions.height);
    // eslint-disable-next-line react-hooks/immutability -- Three.js uniforms are intended to be mutated
    postScene.material.uniforms.texture.value = targetRef.current.texture;
  }, [dimensions, postScene.material]);

  const handleWindowResize = useCallback(() => {
    setDimensions({
      height: window.innerHeight,
      width: window.innerWidth,
    });
  }, []);

  useLayoutEffect(() => {
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
    if (!targetRef.current) {
      return;
    }

    const target = targetRef.current;

    // eslint-disable-next-line react-hooks/immutability -- Three.js uniforms are intended to be mutated
    postScene.material.uniforms.time.value = getSceneTime();

    // Render the main scene to the texture
    gl.setRenderTarget(target);
    gl.render(state.scene, state.camera);

    // Render the post-effect fullscreen quad with a fixed orthographic camera
    gl.setRenderTarget(null);
    gl.render(postScene.scene, orthoCamera);
  }, 1);

  return null;
};

export default PostEffect;
