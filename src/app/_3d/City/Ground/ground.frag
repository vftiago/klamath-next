// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

// world z of the near (street) and far ends of the ground
uniform float uNearZ;
uniform float uFarZ;

in float vWorldZ;

out vec4 fragColor;

// the street pavement color, lifted toward the layers' pink haze with distance
const vec3 NEAR = vec3(14.0, 6.0, 24.0) / 255.0;
const vec3 FAR = vec3(58.0, 20.0, 66.0) / 255.0;

void main(void) {
  float t = clamp((uNearZ - vWorldZ) / (uNearZ - uFarZ), 0.0, 1.0);
  fragColor = vec4(mix(NEAR, FAR, t * t), 1.0);
}
