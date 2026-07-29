import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { Mesh, OrthographicCamera, PlaneGeometry, RawShaderMaterial, Scene, Vector2, WebGLRenderTarget } from "three";
import { getSceneTime } from "../utils";
import fragmentShader from "./post-effect.frag";
import vertexShader from "./post-effect.vert";

type PostScene = {
  geometry: PlaneGeometry;
  material: RawShaderMaterial;
  scene: Scene;
};

const createPostScene = (): PostScene => {
  const scene = new Scene();
  const geometry = new PlaneGeometry(2, 2);
  const material = new RawShaderMaterial({
    fragmentShader,
    uniforms: {
      resolution: { value: new Vector2(1, 1) },
      texture: { value: null },
      time: { value: 0 },
    },
    vertexShader,
  });

  scene.add(new Mesh(geometry, material));

  return { geometry, material, scene };
};

const PostEffect = () => {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const viewport = useThree((state) => state.viewport);

  const orthoCameraRef = useRef<null | OrthographicCamera>(null);
  const postSceneRef = useRef<null | PostScene>(null);
  const targetRef = useRef<null | WebGLRenderTarget>(null);

  if (postSceneRef.current == null) {
    postSceneRef.current = createPostScene();
  }

  if (orthoCameraRef.current == null) {
    orthoCameraRef.current = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  useLayoutEffect(() => {
    const postScene = postSceneRef.current;

    if (!postScene) {
      return;
    }

    // match the canvas drawing buffer (CSS size * dpr), or the scene renders soft on HiDPI screens
    const width = Math.round(size.width * viewport.dpr);
    const height = Math.round(size.height * viewport.dpr);

    targetRef.current?.dispose();
    targetRef.current = new WebGLRenderTarget(width, height, { samples: 4 });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Three.js uniforms are loosely typed
    postScene.material.uniforms.resolution.value.set(width, height);
    postScene.material.uniforms.texture.value = targetRef.current.texture;
  }, [size, viewport.dpr]);

  useLayoutEffect(() => {
    return () => {
      // dispose only — three re-initializes disposed resources on next use, which keeps StrictMode's remount working
      targetRef.current?.dispose();
      postSceneRef.current?.geometry.dispose();
      postSceneRef.current?.material.dispose();
    };
  }, []);

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
