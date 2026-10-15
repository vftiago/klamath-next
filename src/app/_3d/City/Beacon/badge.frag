// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

uniform sampler2D uMap;
uniform float uTime;
// overall brightness (flicker), and the badge radius as a fraction of the quad
uniform float uBrightness;
uniform float uRadius;
uniform float uAnimate;

in vec2 vUv;

out vec4 fragColor;

const vec3 CYAN = vec3(110.0, 236.0, 255.0) / 255.0;

void main(void) {
  vec4 tex = texture(uMap, vUv);
  vec3 color = tex.rgb * tex.a;

  // a cyan band sweeping down the disk, as on the reference badge
  vec2 p = (vUv - 0.5) / uRadius;
  float inside = 1.0 - smoothstep(0.98, 1.0, length(p));
  float bandY = (fract(0.3 * uTime) * 2.6 - 1.3) * uAnimate;
  float band = (1.0 - smoothstep(0.0, 0.2, abs(p.y - bandY))) * inside * uAnimate;
  color += CYAN * 0.22 * band;

  // additive blending (src * alpha + dst): alpha 1 so the color is added as-is
  fragColor = vec4(color * uBrightness, 1.0);
}
