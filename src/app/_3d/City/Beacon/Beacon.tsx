import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CanvasTexture, Group, RawShaderMaterial } from "three";
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, GLSL3 } from "three";
import { getSceneTime } from "../../utils";
import type { CityLayout } from "../generate";
import { BADGE_RADIUS_FRACTION, createBadgeTexture } from "./badge-texture";
import badgeFragmentShader from "./badge.frag";
import badgeVertexShader from "./badge.vert";
import beamFragmentShader from "./beam.frag";
import beamVertexShader from "./beam.vert";

type BeaconProps = {
  /** Bob, flicker, jitter and the scanning band; false holds the badge steady. */
  animate?: boolean;
  layout: CityLayout;
};

/** Trapezoid from a narrow lamp to a wide mouth just under the badge, v = 0 at the lamp. */
const createBeamGeometry = (lampHalfWidth: number, mouthHalfWidth: number, height: number): BufferGeometry => {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(
      [-lampHalfWidth, 0, 0, lampHalfWidth, 0, 0, mouthHalfWidth, height, 0, -mouthHalfWidth, height, 0],
      3,
    ),
  );
  geometry.setAttribute("uv", new Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  return geometry;
};

/**
 * The rooftop searchlight: a dark base and cyan lamp on the roof, a beam rising to a hovering badge that
 * carries the site logo. Badge and beam are additive light.
 */
const Beacon = ({ animate = true, layout }: BeaconProps) => {
  const badgeRef = useRef<Group>(null);
  const badgeMaterialRef = useRef<RawShaderMaterial>(null);
  const [texture] = useState<CanvasTexture>(() => createBadgeTexture());

  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);

  const searchlight = layout.searchlight;
  const radius = searchlight?.radius ?? 1;
  const scale = radius / 40;
  // the badge hovers between 1.4 and 2.4 radii above the roof in the reference; take the middle
  const hover = 1.9 * radius;
  const beamHeight = hover - 1.3 * radius;

  const beamGeometry = useMemo(
    () => createBeamGeometry(2 * scale, 1.35 * radius, beamHeight),
    [beamHeight, radius, scale],
  );

  useEffect(() => {
    return () => beamGeometry.dispose();
  }, [beamGeometry]);

  const badgeUniforms = useMemo(
    () => ({
      uAnimate: { value: animate ? 1 : 0 },
      uBrightness: { value: 0.95 },
      uMap: { value: texture },
      uRadius: { value: BADGE_RADIUS_FRACTION },
      uTime: { value: 0 },
    }),
    [animate, texture],
  );

  useFrame(() => {
    const badge = badgeRef.current;
    const material = badgeMaterialRef.current;

    if (!badge || !material) {
      return;
    }

    const now = getSceneTime();
    material.uniforms.uTime.value = now;

    if (!animate) {
      return;
    }

    // reference: occasional dips and a slow hum in brightness, rare horizontal jitter, a gentle bob
    material.uniforms.uBrightness.value = Math.random() < 0.03 ? 0.45 : 0.86 + 0.1 * Math.sin(21 * now);
    badge.position.x = Math.random() < 0.02 ? (Math.random() - 0.5) * 10 * scale : 0;
    badge.position.y = hover + 3 * scale * Math.sin(1.3 * now);
  });

  if (!searchlight) {
    return null;
  }

  // the quad spans the texture, whose badge radius is a fraction of it
  const quadSize = radius / BADGE_RADIUS_FRACTION;

  return (
    <group position={[searchlight.x, layout.groundY + searchlight.roofY, searchlight.z + 1]}>
      {/* dark mount on the roof */}
      <mesh position={[0, 2.5 * scale, 0]}>
        <planeGeometry args={[18 * scale, 5 * scale]} />
        <meshBasicMaterial color="rgb(10, 4, 20)" />
      </mesh>
      {/* the lamp */}
      <mesh position={[0, 5 * scale, 0.5]}>
        <planeGeometry args={[10 * scale, 3.2 * scale]} />
        <meshBasicMaterial color="rgb(110, 236, 255)" opacity={0.9} transparent={true} />
      </mesh>
      {/* the beam */}
      <mesh frustumCulled={false} geometry={beamGeometry} position={[0, 5 * scale, 0.5]}>
        <rawShaderMaterial
          blending={AdditiveBlending}
          depthWrite={false}
          fragmentShader={beamFragmentShader}
          glslVersion={GLSL3}
          transparent={true}
          vertexShader={beamVertexShader}
        />
      </mesh>
      {/* the hovering badge */}
      <group position={[0, hover, 1]} ref={badgeRef}>
        <mesh frustumCulled={false}>
          <planeGeometry args={[quadSize, quadSize]} />
          <rawShaderMaterial
            blending={AdditiveBlending}
            depthWrite={false}
            fragmentShader={badgeFragmentShader}
            glslVersion={GLSL3}
            ref={badgeMaterialRef}
            transparent={true}
            uniforms={badgeUniforms}
            vertexShader={badgeVertexShader}
          />
        </mesh>
      </group>
    </group>
  );
};

export default Beacon;
