import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { BufferAttribute, RawShaderMaterial } from "three";
import { DynamicDrawUsage, GLSL3 } from "three";
import fragmentShader from "./smoke.frag";
import vertexShader from "./smoke.vert";

export type SmokeSource = {
  /** Left edge and width of the strip the smoke rises from, world units. */
  left: number;
  width: number;
  x: number;
  y: number;
  z: number;
};

type SmokeProps = {
  /** Spawn new particles; false lets the existing ones fade out. */
  active?: boolean;
  sources: SmokeSource[];
};

type Particle = {
  age: number;
  size: number;
  ttl: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
  z: number;
};

const MAX_PARTICLES = 140;

/** Smoke drifting up from the stalls: a CPU particle pool drawn as soft points, as in the reference. */
const Smoke = ({ active = true, sources }: SmokeProps) => {
  const materialRef = useRef<RawShaderMaterial>(null);
  const positionRef = useRef<BufferAttribute>(null);
  const particleRef = useRef<BufferAttribute>(null);
  const particlesRef = useRef<Particle[]>([]);

  const buffers = useMemo(
    () => ({
      particle: new Float32Array(MAX_PARTICLES * 2),
      position: new Float32Array(MAX_PARTICLES * 3),
    }),
    [],
  );

  const uniforms = useMemo(() => ({ uProjectionScale: { value: 1 } }), []);

  useFrame((state, delta) => {
    const material = materialRef.current;
    const position = positionRef.current;
    const particle = particleRef.current;

    if (!material || !position || !particle) {
      return;
    }

    material.uniforms.uProjectionScale.value =
      0.5 * state.size.height * state.viewport.dpr * state.camera.projectionMatrix.elements[5];

    const dt = Math.min(delta, 0.05);
    const particles = particlesRef.current;

    if (active) {
      for (const source of sources) {
        if (particles.length >= MAX_PARTICLES || Math.random() >= 1.4 * dt) {
          continue;
        }
        particles.push({
          age: 0,
          size: 3 + 3 * Math.random(),
          ttl: 2.2 + 2 * Math.random(),
          vx: 6 + 10 * Math.random(),
          vy: 14 + 14 * Math.random(),
          x: source.left + Math.random() * source.width,
          y: source.y,
          z: source.z,
        });
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.ttl) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // write through the attributes' own arrays (the memoized buffers are only the initial storage)
    const positionArray = position.array as Float32Array;
    const particleArray = particle.array as Float32Array;
    particles.forEach((p, i) => {
      const life = p.age / p.ttl;
      positionArray.set([p.x, p.y, p.z], i * 3);
      // diameter grows 16 px over the particle's life; alpha fades in quickly and out slowly
      particleArray.set([2 * (p.size + 16 * life), 0.13 * (1 - life) * Math.min(1, 3 * p.age)], i * 2);
    });
    for (let i = particles.length; i < MAX_PARTICLES; i++) {
      particleArray[i * 2 + 1] = 0;
    }

    position.needsUpdate = true;
    particle.needsUpdate = true;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          args={[buffers.position, 3]}
          attach="attributes-position"
          ref={positionRef}
          usage={DynamicDrawUsage}
        />
        <bufferAttribute
          args={[buffers.particle, 2]}
          attach="attributes-aParticle"
          ref={particleRef}
          usage={DynamicDrawUsage}
        />
      </bufferGeometry>
      <rawShaderMaterial
        depthWrite={false}
        fragmentShader={fragmentShader}
        glslVersion={GLSL3}
        ref={materialRef}
        transparent={true}
        uniforms={uniforms}
        vertexShader={vertexShader}
      />
    </points>
  );
};

export default Smoke;
