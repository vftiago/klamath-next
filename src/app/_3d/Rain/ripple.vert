// GLSL ES 3.0 (three prepends `#version 300 es`).
// Ripple rings lying on the water: a unit quad in the XZ plane scaled by the ring's current radius.
precision highp float;

in vec3 position;
in vec2 uv;
// x, z, birth time, time to live
in vec4 aRipple;
// max radius, peak alpha, tint slot
in vec3 aLook;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform float uTime;
uniform float uGround;

out vec2 vUv;
out float vAlpha;
flat out vec3 vTint;

const vec3 PLAIN = vec3(176.0, 198.0, 240.0) / 255.0;
const vec3 PINK = vec3(255.0, 60.0, 176.0) / 255.0;
const vec3 CYAN = vec3(60.0, 230.0, 255.0) / 255.0;

void main(void) {
  float age = uTime - aRipple.z;
  float life = clamp(age / max(aRipple.w, 1e-3), 0.0, 1.0);
  bool alive = age >= 0.0 && age < aRipple.w;

  // reference: radius grows from 25% to 100%, alpha fades out linearly; tinted rings 1.3x
  float radius = aLook.x * (0.25 + 0.75 * life);
  float tint = aLook.z;
  vTint = tint < 0.5 ? PLAIN : tint < 1.5 ? PINK : CYAN;
  vAlpha = alive ? aLook.y * (1.0 - life) * (tint < 0.5 ? 1.0 : 1.3) : 0.0;
  vUv = uv;

  vec3 world = vec3(aRipple.x + position.x * radius * 2.0, uGround + 0.5, aRipple.y - position.y * radius * 2.0);
  gl_Position = projectionMatrix * viewMatrix * vec4(alive ? world : vec3(0.0, -1e5, 0.0), 1.0);
}
