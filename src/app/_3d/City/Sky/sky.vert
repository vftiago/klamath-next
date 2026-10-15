// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

in vec3 position;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;

out float vWorldY;

void main(void) {
  vWorldY = (modelMatrix * vec4(position, 1.0)).y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
