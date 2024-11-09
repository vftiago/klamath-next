precision highp float;

uniform float time;

const float duration = 2.0;
const float delay = 2.0;
const float radius = 0.6;
const vec3 color = vec3(0.8, 0.8, 0.8);

void main() {
  float now = clamp((time - delay) / duration, 0.0, 1.0);
  float opacity = 0.6 * 0.5 * now;

  gl_FragColor = vec4(color, opacity);
}
