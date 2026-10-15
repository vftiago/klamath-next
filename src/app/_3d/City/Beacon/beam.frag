// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

in vec2 vUv;

out vec4 fragColor;

const vec3 CYAN = vec3(110.0, 236.0, 255.0) / 255.0;

void main(void) {
  // the beam fades from 28% at the lamp (v = 0) to nothing just under the badge (v = 1),
  // and softens toward its side edges
  float along = 1.0 - vUv.y;
  float side = 1.0 - smoothstep(0.6, 1.0, abs(vUv.x - 0.5) * 2.0);
  // additive blending (src * alpha + dst): alpha 1 so the color is added as-is
  fragColor = vec4(CYAN * 0.28 * along * side, 1.0);
}
