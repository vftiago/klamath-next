import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Mesh, OrthographicCamera, PlaneGeometry, RawShaderMaterial, Scene, Vector2, WebGLRenderTarget } from "three";
import { getSceneTime } from "../utils";
import fragmentShader from "./post-effect.frag";
import vertexShader from "./post-effect.vert";

type PostScene = {
  material: RawShaderMaterial;
  scene: Scene;
};

const createPostScene = (): PostScene => {
  const scene = new Scene();
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

  scene.add(mesh);

  return { material, scene };
};

const PostEffect = () => {
  const { gl } = useThree();

  const orthoCameraRef = useRef<null | OrthographicCamera>(null);
  const postSceneRef = useRef<null | PostScene>(null);
  const targetRef = useRef<null | WebGLRenderTarget>(null);

  const [dimensions, setDimensions] = useState(() => ({
    height: window.innerHeight,
    width: window.innerWidth,
  }));

  if (postSceneRef.current == null) {
    postSceneRef.current = createPostScene();
  }

  if (orthoCameraRef.current == null) {
    orthoCameraRef.current = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  const initRenderTarget = useCallback(() => {
    const postScene = postSceneRef.current;

    if (!postScene) {
      return;
    }

    if (targetRef.current) {
      targetRef.current.dispose();
    }

    targetRef.current = new WebGLRenderTarget(dimensions.width, dimensions.height);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Three.js uniforms are loosely typed
    postScene.material.uniforms.resolution.value.set(dimensions.width, dimensions.height);
    postScene.material.uniforms.texture.value = targetRef.current.texture;
  }, [dimensions]);

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
    const orthoCamera = orthoCameraRef.current;
    const postScene = postSceneRef.current;
    const target = targetRef.current;

    if (!orthoCamera || !postScene || !target) {
      return;
    }

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
