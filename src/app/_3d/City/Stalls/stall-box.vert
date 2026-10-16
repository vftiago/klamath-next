// GLSL ES 3.0 (three prepends `#version 300 es`).
// Unit box (position in [-0.5, 0.5]^3) scaled per instance by aSize from its min corner aOffset.
precision highp float;

in vec3 position;
in vec3 normal;
in vec3 aOffset;
in vec3 aSize;
in vec3 aColor;
// stripes (0 = solid), rise of the back edge (world units, a sloped roof), emissive flag,
// top-only flag (the rise shears just the top face, so a wall under a sloped roof meets it)
in vec4 aParams;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;

out vec3 vLocal;
flat out vec3 vNormal;
flat out vec3 vColor;
flat out vec4 vParams;

void main(void) {
  vec3 local = position + 0.5;
  vec3 world = aOffset + local * aSize;
  // shear the box so its back edge (local z = 0) sits higher: the roof slopes down toward the front
  world.y += aParams.y * (1.0 - local.z) * (aParams.w > 0.5 ? local.y : 1.0);

  vLocal = local;
  vNormal = normal;
  vColor = aColor;
  vParams = aParams;

  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
