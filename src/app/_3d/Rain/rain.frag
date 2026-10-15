// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

in float vAlong;
in float vAlpha;
flat in vec3 vTint;

out vec4 fragColor;

void main(void) {
  // gradient tail: full at the head, nothing at the tail end
  fragColor = vec4(vTint, vAlpha * (1.0 - vAlong));
}
