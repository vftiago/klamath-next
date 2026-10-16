// GLSL ES 3.0 (three prepends `#version 300 es`).
// Unit plane (position in [-0.5, 0.5]^2) scaled per instance by aSize, placed by its bottom-left corner:
// vertical and facing +z, or (aFlat) lying on the ground and extending toward -z from its front edge.
precision highp float;

in vec3 position;
in vec3 aOffset;
in vec2 aSize;
// sprite rect in the sheet: u0, v0, u1, v1
in vec4 aUv;
in float aFlat;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;

out vec2 vUv;

void main(void) {
  vec2 local = position.xy + 0.5;
  vec3 extent = aFlat > 0.5 ? vec3(local.x * aSize.x, 0.0, -local.y * aSize.y) : vec3(local * aSize, 0.0);
  vec3 world = aOffset + extent;
  vUv = mix(aUv.xy, aUv.zw, local);
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
