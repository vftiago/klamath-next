// GLSL ES 3.0 (three prepends `#version 300 es`).
// Unit box (position in [-0.5, 0.5]^3) scaled per instance by aSize and placed at aOffset.
// No rotation, so the local normal doubles as the world normal.
precision highp float;

in vec3 position;
in vec3 normal;
in vec3 aOffset;
in vec3 aSize;
in float aSeed;
in float aPattern;
in float aFrame;
in vec4 aRands;
// window-free band behind a facade sign: [top, bottom] from the roof, world units; (-1, -1) = none
in vec2 aBlank;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;

out vec3 vLocal;
out vec3 vNormal;
out float vWorldY;
flat out vec3 vSize;
flat out float vSeed;
flat out float vPattern;
flat out float vFrame;
flat out float vCameraSide;
flat out vec4 vRands;
flat out vec2 vBlank;

void main(void) {
  vec3 local = vec3(position.x * aSize.x, (position.y + 0.5) * aSize.y, position.z * aSize.z);
  vec3 world = aOffset + local;

  vLocal = local;
  vSize = aSize;
  vNormal = normal;
  vSeed = aSeed;
  vPattern = aPattern;
  vFrame = aFrame;
  vWorldY = world.y;
  vRands = aRands;
  vBlank = aBlank;
  // which side of the building the camera is on: +1 when the camera is to the right of its center
  vCameraSide = cameraPosition.x >= aOffset.x ? 1.0 : -1.0;

  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
