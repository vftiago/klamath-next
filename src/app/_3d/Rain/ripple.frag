// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

in vec2 vUv;
in float vAlpha;
flat in vec3 vTint;

out vec4 fragColor;

void main(void) {
  if (vAlpha <= 0.0) {
    discard;
  }
  // a thin ring near the quad's edge
  float d = length(vUv - 0.5) * 2.0;
  float ring = smoothstep(0.7, 0.9, d) * (1.0 - smoothstep(0.95, 1.0, d));
  fragColor = vec4(vTint, vAlpha * ring);
}
