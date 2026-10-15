// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

in float vAlpha;

out vec4 fragColor;

const vec3 SMOKE = vec3(235.0, 225.0, 245.0) / 255.0;

void main(void) {
  if (vAlpha <= 0.0) {
    discard;
  }
  // the reference's soft sprite: 1 at the center, 0.35 halfway, 0 at the edge
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float soft = d < 0.5 ? mix(1.0, 0.35, d * 2.0) : mix(0.35, 0.0, (d - 0.5) * 2.0);
  fragColor = vec4(SMOKE, vAlpha * clamp(soft, 0.0, 1.0));
}
