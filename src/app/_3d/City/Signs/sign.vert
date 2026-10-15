// GLSL ES 3.0 (three prepends `#version 300 es`).
// Unit plane (position in [-0.5, 0.5]^2) scaled per instance by aSize, placed by its bottom-left corner.
precision highp float;

in vec3 position;
in vec3 aOffset;
in vec2 aSize;
in vec3 aColor;
// cell size, margin, vertical (0/1), glyph count
in vec4 aParams;
in vec4 aGlyphs;
// dim, dead glyph index, world units per reference px
in vec3 aMeta;
// level, off glyph index (dynamic)
in vec2 aState;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;

out vec2 vLocal;
flat out vec2 vSize;
flat out vec3 vColor;
flat out vec4 vParams;
flat out vec4 vGlyphs;
flat out vec3 vMeta;
flat out vec2 vState;

void main(void) {
  vec2 local = (position.xy + 0.5) * aSize;
  vec3 world = aOffset + vec3(local, 0.0);

  vLocal = local;
  vSize = aSize;
  vColor = aColor;
  vParams = aParams;
  vGlyphs = aGlyphs;
  vMeta = aMeta;
  vState = aState;

  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
