// GLSL ES 3.0 (three prepends `#version 300 es`).
// Unit sphere scaled per instance by aRadius and placed at aCenter.
precision highp float;

in vec3 position;
in vec3 aCenter;
in float aRadius;
in vec3 aColor;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;

out vec3 vWorld;
flat out vec3 vCenter;
flat out float vRadius;
flat out vec3 vColor;

void main(void) {
  vec3 world = aCenter + position * aRadius;

  vWorld = world;
  vCenter = aCenter;
  vRadius = aRadius;
  vColor = aColor;

  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
