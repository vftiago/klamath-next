precision highp float;

uniform float time;

varying vec3 vPosition;

const float duration = 2.0;
const float delay = 1.0;
const float radius = 400.0;

const vec3 color = vec3(1.0);

void main() {
  float now = clamp((time - delay) / duration, 0.0, 1.0);
  float distance = length(vPosition.xy) / radius;
  float opacity = (1.0 - distance) * 0.1 * now;
  
  gl_FragColor = vec4(color, opacity);
}
