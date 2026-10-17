// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

uniform sampler2D uSheet;

in vec2 vUv;

out vec4 fragColor;

void main(void) {
  fragColor = texture(uSheet, vUv);
}
