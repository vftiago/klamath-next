// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

uniform sampler2D uMap;
uniform float uTime;
// viewport size in CSS px, used to express the reference's pixel-based wobble in texture space
uniform vec2 uViewport;
// world z of the shoreline (the nearest layer's base) and of the river's near edge
uniform float uShoreZ;
uniform float uEdgeZ;
// strength of the whole effect, 0 = flat tinted water (static tier)
uniform float uReflection;

in vec4 vReflectionCoord;
in vec3 vWorld;

out vec4 fragColor;

const vec3 WATER_FAR = vec3(46.0, 12.0, 58.0) / 255.0;
const vec3 WATER_NEAR = vec3(5.0, 1.0, 15.0) / 255.0;
const vec3 OVERLAY_FAR = vec3(8.0, 2.0, 20.0) / 255.0;
const vec3 OVERLAY_NEAR = vec3(5.0, 1.0, 15.0) / 255.0;
const vec3 SHORELINE = vec3(255.0, 140.0, 210.0) / 255.0;

void main(void) {
  // 0 at the shoreline, 1 at the near edge
  float a = clamp((vWorld.z - uShoreZ) / (uEdgeZ - uShoreZ), 0.0, 1.0);
  // distance from the shore, roughly in reference pixels
  float y = (vWorld.z - uShoreZ) * 0.5;

  // the reference's two overlapping sine wobbles, growing with distance from the shore
  float wobble = (0.6 + 6.0 * a) * sin(0.21 * y + 2.3 * uTime) + (0.4 + 2.5 * a) * sin(0.057 * y - 1.3 * uTime);

  vec2 uv = vReflectionCoord.xy / vReflectionCoord.w;
  uv.x += wobble * uReflection / uViewport.x;
  // the reference copies one source row into a 3 px slab: quantize the lookup rows to keep that stepped look
  uv.y = (floor(uv.y * uViewport.y / 3.0) + 0.5) * 3.0 / uViewport.y;
  uv = clamp(uv, 0.0, 1.0);

  vec3 reflection = texture(uMap, uv).rgb;
  vec3 water = mix(WATER_FAR, WATER_NEAR, a);
  vec3 color = mix(water, reflection, 0.7 * uReflection);

  // darken toward the viewer. The reference ramps 0.15 -> 0.72, but there the bright stalls reflect right at
  // the shore; here the tall layers reflect mid-river, so the ramp is gentler to keep them readable.
  color = mix(color, mix(OVERLAY_FAR, OVERLAY_NEAR, a), mix(0.1, 0.55, a * a));

  // 1 px pink shoreline
  float shore = 1.0 - smoothstep(0.0, 2.0 * fwidth(vWorld.z), vWorld.z - uShoreZ);
  color = mix(color, SHORELINE, 0.12 * shore);

  fragColor = vec4(color, 1.0);
}
