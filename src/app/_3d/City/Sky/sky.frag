// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

uniform float uGround;
// world height over which the horizon glow fades into the zenith color
uniform float uFade;

in float vWorldY;

out vec4 fragColor;

// dusk palette: deep indigo overhead, purple mid-sky, pink-magenta at the horizon with a warm glow on the line
const vec3 ZENITH = vec3(40.0, 22.0, 80.0) / 255.0;
const vec3 MID = vec3(96.0, 40.0, 128.0) / 255.0;
const vec3 HORIZON = vec3(200.0, 90.0, 150.0) / 255.0;
const vec3 GLOW = vec3(245.0, 150.0, 140.0) / 255.0;

// below the horizon line the plane stands in for distant water until the river covers it
const vec3 BELOW = vec3(52.0, 18.0, 66.0) / 255.0;

void main(void) {
  float t = clamp((vWorldY - uGround) / uFade, 0.0, 1.0);
  vec3 color = mix(HORIZON, MID, smoothstep(0.0, 0.45, t));
  color = mix(color, ZENITH, smoothstep(0.4, 1.0, t));
  float glow = 1.0 - smoothstep(0.0, 0.12, t);
  color = mix(color, GLOW, 0.7 * glow * glow);

  float below = clamp((uGround - vWorldY) / (0.08 * uFade), 0.0, 1.0);
  color = mix(color, BELOW, below);

  fragColor = vec4(color, 1.0);
}
