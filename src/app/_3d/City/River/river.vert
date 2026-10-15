// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

in vec3 position;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
// bias * mirrorProjection * mirrorView: maps world positions to reflection-texture coordinates
uniform mat4 uTextureMatrix;

out vec4 vReflectionCoord;
out vec3 vWorld;

void main(void) {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vReflectionCoord = uTextureMatrix * world;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
