// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

flat in float vCoreFraction;
flat in float vVisible;

out vec4 fragColor;

const vec3 RED = vec3(255.0, 70.0, 80.0) / 255.0;

void main(void) {
  if (vVisible < 0.5) {
    discard;
  }

  // distance from the point center, 1 at the glow radius
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float core = 0.85 * (1.0 - smoothstep(vCoreFraction * 0.7, vCoreFraction * 1.3, d));
  float glow = 0.16 * (1.0 - smoothstep(vCoreFraction, 1.0, d));
  float alpha = max(core, glow);

  fragColor = vec4(RED, alpha);
}
