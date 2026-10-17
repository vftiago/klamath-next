// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

uniform sampler2D uMap;
uniform float uAlpha;
// how many tiles span the plane horizontally, and the current scroll in tiles
uniform float uRepeat;
uniform float uScroll;

in vec2 vUv;

out vec4 fragColor;

void main(void) {
  vec4 fog = texture(uMap, vec2(fract(vUv.x * uRepeat + uScroll), vUv.y));
  fragColor = vec4(fog.rgb, fog.a * uAlpha);
}
