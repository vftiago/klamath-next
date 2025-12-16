precision highp float;

uniform float time;
uniform vec2 resolution;
uniform sampler2D texture;

varying vec2 vUv;

const float duration = 2.0;
const float delay = 1.0;

float random(vec2 c) {
  return fract(sin(dot(c.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float now = clamp((time - delay) / duration, 0.0, 1.0);

  float opacity = 0.1 * now;

  float whiteNoise = random(vUv.xy * time) * 0.1 - 0.1;

  float monitor1 = abs(sin(vUv.y * resolution.y * 2.4 + time * 10.0)) * 0.04;
  float monitor2 = abs(sin(vUv.y * resolution.y * 1.0 + time * 3.0)) * 0.04;

  float monitor = monitor1 - monitor2;

  float vignetteMask = smoothstep(0.8, 1.4, length(vUv * 2.0 - 1.0));
  vec3 vignette = vignetteMask * vec3(1.0, 1.0, 1.0) * 0.1;

  vec3 texColor = texture2D(texture, vUv).rgb;

  vec3 finalColor = texColor + whiteNoise + monitor + vignette;

  finalColor = clamp(finalColor, 0.0, 1.0);

  finalColor *= now;

  gl_FragColor = vec4(finalColor, opacity);
}
