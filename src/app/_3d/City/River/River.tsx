import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { Mesh, RawShaderMaterial } from "three";
import {
  GLSL3,
  LinearFilter,
  Matrix4,
  PerspectiveCamera,
  Plane,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
} from "three";
import { getSceneTime } from "../../utils";
import { GROUND_Y, LAYERS } from "../config";
import fragmentShader from "./river.frag";
import vertexShader from "./river.vert";

type RiverProps = {
  /** Reflection render-target scale relative to the drawing buffer; 0 skips the reflection pass. */
  reflectionScale?: number;
  /** World z of the shoreline (the pavement's edge). */
  shoreZ: number;
};

/** Far end of the water, behind the farthest layer, and its near edge behind the default camera. */
const RIVER_FAR_Z = LAYERS[0].z - 400;
const RIVER_NEAR_Z = 1300;
const RIVER_WIDTH = 24000;
/** The near edge used for the wobble/darkening ramp sits before the camera. */
const EDGE_Z = 800;

const UP = new Vector3(0, 1, 0);
const PLANE_POINT = new Vector3(0, GROUND_Y, 0);
const CLIP_BIAS = 0.0;

/**
 * Planar-reflection state, ported from three's Reflector: a camera mirrored across the water plane renders
 * the scene into a texture, with an oblique near plane so nothing below the surface leaks in.
 */
const createReflection = () => ({
  cameraWorldPosition: new Vector3(),
  clipPlane: new Vector4(),
  lookAtPosition: new Vector3(),
  mirrorCamera: new PerspectiveCamera(),
  q: new Vector4(),
  reflectorPlane: new Plane(),
  rotationMatrix: new Matrix4(),
  target: new Vector3(),
  textureMatrix: new Matrix4(),
  view: new Vector3(),
});

const River = ({ reflectionScale = 0.5, shoreZ }: RiverProps) => {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const viewport = useThree((state) => state.viewport);

  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<RawShaderMaterial>(null);
  const targetRef = useRef<null | WebGLRenderTarget>(null);
  const reflectionRef = useRef<null | ReturnType<typeof createReflection>>(null);

  if (reflectionRef.current == null) {
    reflectionRef.current = createReflection();
  }

  const uniforms = useMemo(
    () => ({
      uEdgeZ: { value: EDGE_Z },
      uMap: { value: null },
      uReflection: { value: reflectionScale > 0 ? 1 : 0 },
      uShoreZ: { value: shoreZ },
      uTextureMatrix: { value: new Matrix4() },
      uTime: { value: 0 },
      uViewport: { value: new Vector2(1, 1) },
    }),
    [reflectionScale, shoreZ],
  );

  useLayoutEffect(() => {
    targetRef.current?.dispose();
    targetRef.current = null;

    if (reflectionScale <= 0) {
      return;
    }

    const width = Math.max(1, Math.round(size.width * viewport.dpr * reflectionScale));
    const height = Math.max(1, Math.round(size.height * viewport.dpr * reflectionScale));

    targetRef.current = new WebGLRenderTarget(width, height, {
      magFilter: LinearFilter,
      minFilter: LinearFilter,
    });

    const materialUniforms = materialRef.current?.uniforms;

    if (materialUniforms) {
      materialUniforms.uMap.value = targetRef.current.texture;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Three.js uniforms are loosely typed
      materialUniforms.uViewport.value.set(size.width, size.height);
    }
  }, [size, viewport.dpr, reflectionScale]);

  useLayoutEffect(() => {
    return () => {
      targetRef.current?.dispose();
    };
  }, []);

  // reflection pass: runs before the post-effect (priority 1), which renders the main scene
  useFrame((state) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    const target = targetRef.current;
    const reflection = reflectionRef.current;

    if (!material) {
      return;
    }

    material.uniforms.uTime.value = getSceneTime();

    if (!mesh || !target || !reflection) {
      return;
    }

    const camera = state.camera;
    const {
      cameraWorldPosition,
      clipPlane,
      lookAtPosition,
      mirrorCamera,
      q,
      reflectorPlane,
      rotationMatrix,
      target: lookTarget,
      textureMatrix,
      view,
    } = reflection;

    cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
    view.subVectors(PLANE_POINT, cameraWorldPosition);

    // camera under the water: nothing to reflect
    if (view.dot(UP) > 0) {
      return;
    }

    view.reflect(UP).negate();
    view.add(PLANE_POINT);

    rotationMatrix.extractRotation(camera.matrixWorld);
    lookAtPosition.set(0, 0, -1);
    lookAtPosition.applyMatrix4(rotationMatrix);
    lookAtPosition.add(cameraWorldPosition);

    lookTarget.subVectors(PLANE_POINT, lookAtPosition);
    lookTarget.reflect(UP).negate();
    lookTarget.add(PLANE_POINT);

    mirrorCamera.position.copy(view);
    mirrorCamera.up.set(0, 1, 0);
    mirrorCamera.up.applyMatrix4(rotationMatrix);
    mirrorCamera.up.reflect(UP);
    mirrorCamera.lookAt(lookTarget);
    mirrorCamera.far = camera.far;
    mirrorCamera.updateMatrixWorld();
    // same frustum (including the lens shift) as the main camera
    mirrorCamera.projectionMatrix.copy(camera.projectionMatrix);

    textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    textureMatrix.multiply(mirrorCamera.projectionMatrix);
    textureMatrix.multiply(mirrorCamera.matrixWorldInverse);

    // oblique near plane: clip everything below the water surface
    reflectorPlane.setFromNormalAndCoplanarPoint(UP, PLANE_POINT);
    reflectorPlane.applyMatrix4(mirrorCamera.matrixWorldInverse);
    clipPlane.set(reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant);

    const projection = mirrorCamera.projectionMatrix;
    q.x = (Math.sign(clipPlane.x) + projection.elements[8]) / projection.elements[0];
    q.y = (Math.sign(clipPlane.y) + projection.elements[9]) / projection.elements[5];
    q.z = -1;
    q.w = (1 + projection.elements[10]) / projection.elements[14];
    clipPlane.multiplyScalar(2 / clipPlane.dot(q));
    projection.elements[2] = clipPlane.x;
    projection.elements[6] = clipPlane.y;
    projection.elements[10] = clipPlane.z + 1 - CLIP_BIAS;
    projection.elements[14] = clipPlane.w;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Three.js uniforms are loosely typed
    material.uniforms.uTextureMatrix.value.copy(textureMatrix);

    mesh.visible = false;
    gl.setRenderTarget(target);
    gl.render(state.scene, mirrorCamera);
    gl.setRenderTarget(null);
    mesh.visible = true;
  }, 0.5);

  return (
    <mesh
      frustumCulled={false}
      position={[0, GROUND_Y, (RIVER_FAR_Z + RIVER_NEAR_Z) / 2]}
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[RIVER_WIDTH, RIVER_NEAR_Z - RIVER_FAR_Z]} />
      <rawShaderMaterial
        fragmentShader={fragmentShader}
        glslVersion={GLSL3}
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
      />
    </mesh>
  );
};

export default River;
