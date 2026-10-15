// GLSL ES 3.0 (three prepends `#version 300 es`).
// Unit plane (position in [-0.5, 0.5]^2) scaled per instance by aSize and centered at aOffset.
precision highp float;

in vec3 position;
in vec3 aOffset;
in vec2 aSize;
in vec3 aColor;
// layer depth 0 (far) .. 1 (near), world units per reference pixel, character count
in vec3 aLayer;
in vec4 aGlyphs0;
in vec4 aGlyphs1;
in vec4 aGlyphs2;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;

// board coords from the bottom-left corner, world units
out vec2 vLocal;
flat out vec2 vSize;
flat out vec3 vColor;
flat out vec3 vLayer;
flat out vec4 vGlyphs0;
flat out vec4 vGlyphs1;
flat out vec4 vGlyphs2;

void main(void) {
  vec3 world = aOffset + vec3(position.x * aSize.x, position.y * aSize.y, 0.0);

  vLocal = (position.xy + 0.5) * aSize;
  vSize = aSize;
  vColor = aColor;
  vLayer = aLayer;
  vGlyphs0 = aGlyphs0;
  vGlyphs1 = aGlyphs1;
  vGlyphs2 = aGlyphs2;

  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
