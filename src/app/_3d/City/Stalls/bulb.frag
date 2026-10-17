// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

flat in float vCoreFraction;

out vec4 fragColor;

const vec3 CORE = vec3(255.0, 240.0, 210.0) / 255.0;
const vec3 HALO = vec3(255.0, 226.0, 170.0) / 255.0;

void main(void) {
  // distance from the point center, 1 at the halo radius
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float core = 1.0 - smoothstep(vCoreFraction * 0.7, vCoreFraction * 1.5, d);
  float halo = 0.6 * (1.0 - smoothstep(0.0, 1.0, d));
  float alpha = max(core, halo);

  fragColor = vec4(mix(HALO, CORE, core), alpha);
}
