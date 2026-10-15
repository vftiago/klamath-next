// GLSL ES 3.0 (three prepends `#version 300 es`).
// Each drop is a thin quad: position.x is the side (-0.5..0.5), position.y runs from the head (0) to the
// tail (1). Everything about the drop comes from its seeds and the time, so there is no per-frame CPU work.
precision highp float;

in vec3 position;
// four uniform randoms per drop
in vec4 aSeed;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform float uTime;
// world y of the water / ground line
uniform float uGround;
// drops live between these world z (far, near)
uniform vec2 uDepthRange;
// visible width (at z = 0) and height, world units, and the camera's z: used to size drops like screen px
uniform vec3 uView;
// wind slope (dx per unit fallen) and the global intensity pulse
uniform vec2 uWeather;

out float vAlong;
out float vAlpha;
flat out vec3 vTint;

const vec3 PLAIN = vec3(176.0, 198.0, 240.0) / 255.0;
const vec3 PINK = vec3(255.0, 60.0, 176.0) / 255.0;
const vec3 CYAN = vec3(60.0, 230.0, 255.0) / 255.0;
const vec3 LIME = vec3(214.0, 255.0, 60.0) / 255.0;

void main(void) {
  float z = aSeed.x;
  float worldZ = mix(uDepthRange.x, uDepthRange.y, z);
  // world units per screen px at this depth
  float s = (uView.z - worldZ) / 1024.0;

  // reference: speed 700 + 1600 z px/s, length 2.4-3.4% of the speed, slight per-drop drift
  float speed = (700.0 + 1600.0 * z) * s;
  float len = speed * (0.024 + 0.01 * aSeed.y);
  float drift = (aSeed.z - 0.5) * 0.04;
  float slope = uWeather.x + drift;

  // fall from above the visible top down to the water, then wrap
  float top = uGround + uView.y * s * 1.15 + 60.0 * s;
  float fallDistance = top - uGround;
  float phase = aSeed.w * fallDistance;
  float fallen = mod(speed * uTime + phase, fallDistance);
  float headY = top - fallen;

  // x drifts with the wind as the drop falls, wrapped over a generous width
  float width = uView.x * s * 1.4;
  float x0 = (aSeed.y * 7.0 + aSeed.z * 13.0 + aSeed.w * 3.0);
  float headX = mod(x0 * width + fallen * slope, width) - width * 0.5;

  // tail is above and up-wind of the head; don't let it poke above the spawn line
  float tail = min(len, fallen);
  vec3 head = vec3(headX, headY, worldZ);
  vec3 dir = normalize(vec3(-slope, 1.0, 0.0));
  float thickness = (z > 0.75 ? 1.4 : 1.0) * s;
  vec3 side = vec3(1.0, 0.0, 0.0) * thickness;

  vec3 world = head + dir * (position.y * tail) + side * position.x;

  // reference alpha: brighter and longer when near, fading in just under the top, tinted drops 1.4x
  float tintRoll = aSeed.w;
  vTint = tintRoll < 0.09 ? PINK : tintRoll < 0.15 ? CYAN : tintRoll < 0.18 ? LIME : PLAIN;
  float tinted = tintRoll < 0.18 ? 1.4 : 1.0;
  float fadeIn = clamp(fallen / (0.18 * fallDistance), 0.0, 1.0);
  bool far = z < 0.4 && tintRoll >= 0.18;
  vAlpha = far ? 0.12 * uWeather.y * fadeIn : (0.1 + 0.32 * z) * uWeather.y * fadeIn * tinted;
  vAlong = position.y;

  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
