// GLSL ES 3.0 (three prepends `#version 300 es`).
// Unit plane (position in [-0.5, 0.5]^2) scaled per instance by aSize.xy and centered at aOffset.
precision highp float;

in vec3 position;
in vec3 aOffset;
// board width, height, corner radius, border width (world units)
in vec4 aSize;
in vec3 aColor;
// board background
in vec3 aBacking;
// layer depth 0 (far) .. 1 (near), world units per reference pixel, character count, character cell (world units)
in vec4 aLayer;
in vec4 aGlyphs0;
in vec4 aGlyphs1;
in vec4 aGlyphs2;
// border core, border halo and text brightness, depth dim
in vec4 aShine;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;

// board coords from the bottom-left corner, world units
out vec2 vLocal;
flat out vec4 vSize;
flat out vec3 vColor;
flat out vec3 vBacking;
flat out vec4 vLayer;
flat out vec4 vGlyphs0;
flat out vec4 vGlyphs1;
flat out vec4 vGlyphs2;
flat out vec4 vShine;

void main(void) {
  vec3 world = aOffset + vec3(position.x * aSize.x, position.y * aSize.y, 0.0);

  vLocal = (position.xy + 0.5) * aSize.xy;
  vSize = aSize;
  vColor = aColor;
  vBacking = aBacking;
  vLayer = aLayer;
  vGlyphs0 = aGlyphs0;
  vGlyphs1 = aGlyphs1;
  vGlyphs2 = aGlyphs2;
  vShine = aShine;

  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
