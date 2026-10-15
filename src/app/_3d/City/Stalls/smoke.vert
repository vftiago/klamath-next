// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

in vec3 position;
// size (world units), alpha
in vec2 aParticle;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float uProjectionScale;

out float vAlpha;

void main(void) {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vAlpha = aParticle.y;
  gl_PointSize = aParticle.x * uProjectionScale / max(1.0, -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
