// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

in vec3 position;
// core and halo radii, world units
in vec2 aRadii;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
// 0.5 * drawing-buffer height * projectionMatrix[1][1]: converts world size / depth to pixels
uniform float uProjectionScale;

flat out float vCoreFraction;

void main(void) {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vCoreFraction = aRadii.x / aRadii.y;

  gl_PointSize = (2.0 * aRadii.y) * uProjectionScale / max(1.0, -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
