// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

in vec2 vLocal;
flat in vec2 vSize;
flat in vec3 vColor;
flat in float vR;
flat in float vPx;

out vec4 fragColor;

const vec3 BASE_FAR = vec3(26.0, 4.0, 51.0) / 255.0;
const vec3 BASE_NEAR = vec3(5.0, 1.0, 15.0) / 255.0;

// fraction of a pixel footprint of width fw, centered at x, inside [0, len]
float segCoverage(float x, float len, float fw) {
  float lo = max(x - 0.5 * fw, 0.0);
  float hi = min(x + 0.5 * fw, len);
  return clamp((hi - lo) / max(fw, 1e-5), 0.0, 1.0);
}

// coverage of an axis-aligned rect [x0, x0 + w] x [y0, y0 + h]
float rectCoverage(vec2 p, vec2 origin, vec2 size, vec2 fw) {
  return segCoverage(p.x - origin.x, size.x, fw.x) * segCoverage(p.y - origin.y, size.y, fw.y);
}

void main(void) {
  vec2 fw = fwidth(vLocal);
  float u = vLocal.x;
  float v = vLocal.y;
  float w = vSize.x;
  float h = vSize.y;

  // board: base wall color lifted 5% toward white
  vec3 color = mix(mix(BASE_FAR, BASE_NEAR, vR), vec3(1.0), 0.05);

  // neon frame: 1 px stroke inset 1 px, with a soft inner glow standing in for the reference's shadow blur
  float frameAlpha = 0.18 + 0.3 * vR;
  float edge = min(min(u, w - u), min(v, h - v));
  float stroke = segCoverage(edge - vPx, vPx, max(fw.x, fw.y));
  float glow = 1.0 - smoothstep(vPx, 6.0 * vPx, edge);
  color = mix(color, vColor, frameAlpha * 0.45 * glow);
  color = mix(color, vColor, frameAlpha * stroke);

  // two "text" bars, measured from the top of the board
  float textAlpha = 0.08 + 0.12 * vR;
  float bar1 = rectCoverage(vec2(u, v), vec2(0.12 * w, h - 0.3 * h - max(vPx, 0.14 * h)), vec2(0.6 * w, max(vPx, 0.14 * h)), fw);
  float bar2 = rectCoverage(vec2(u, v), vec2(0.12 * w, h - 0.58 * h - max(vPx, 0.1 * h)), vec2(0.4 * w, max(vPx, 0.1 * h)), fw);
  color = mix(color, vColor, textAlpha * max(bar1, bar2));

  fragColor = vec4(color, 1.0);
}
