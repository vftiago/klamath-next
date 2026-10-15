// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

uniform sampler2D uAtlas;
// atlas grid: columns, rows per variant band
uniform vec2 uAtlasGrid;

in vec2 vLocal;
flat in vec2 vSize;
flat in vec3 vColor;
flat in vec3 vLayer;
flat in vec4 vGlyphs0;
flat in vec4 vGlyphs1;
flat in vec4 vGlyphs2;

out vec4 fragColor;

const float ATLAS_VARIANTS = 3.0;
const float VARIANT_HALO = 0.0;
const float VARIANT_CORE = 1.0;

const vec3 BASE_FAR = vec3(26.0, 4.0, 51.0) / 255.0;
const vec3 BASE_NEAR = vec3(5.0, 1.0, 15.0) / 255.0;

// fraction of a pixel footprint of width fw, centered at x, inside [0, len]
float segCoverage(float x, float len, float fw) {
  float lo = max(x - 0.5 * fw, 0.0);
  float hi = min(x + 0.5 * fw, len);
  return clamp((hi - lo) / max(fw, 1e-5), 0.0, 1.0);
}

float glyphAt(int k) {
  if (k < 4) return k == 0 ? vGlyphs0.x : k == 1 ? vGlyphs0.y : k == 2 ? vGlyphs0.z : vGlyphs0.w;
  if (k < 8) return k == 4 ? vGlyphs1.x : k == 5 ? vGlyphs1.y : k == 6 ? vGlyphs1.z : vGlyphs1.w;
  return k == 8 ? vGlyphs2.x : k == 9 ? vGlyphs2.y : k == 10 ? vGlyphs2.z : vGlyphs2.w;
}

float atlas(float glyph, float variant, vec2 p) {
  float col = mod(glyph, uAtlasGrid.x);
  float row = floor(glyph / uAtlasGrid.x);
  vec2 uv = vec2((col + p.x) / uAtlasGrid.x, 1.0 - (variant * uAtlasGrid.y + row + p.y) / (ATLAS_VARIANTS * uAtlasGrid.y));
  return texture(uAtlas, uv).a;
}

void main(void) {
  vec2 fw = fwidth(vLocal);
  float u = vLocal.x;
  float v = vLocal.y;
  float w = vSize.x;
  float h = vSize.y;
  float r = vLayer.x;
  float px = vLayer.y;
  int count = int(vLayer.z + 0.5);

  // board: base wall color lifted 5% toward white
  vec3 color = mix(mix(BASE_FAR, BASE_NEAR, r), vec3(1.0), 0.05);

  // neon frame: 1 px stroke inset 1 px, with a soft inner glow standing in for the reference's shadow blur
  float frameAlpha = 0.18 + 0.3 * r;
  float edge = min(min(u, w - u), min(v, h - v));
  float stroke = segCoverage(edge - px, px, max(fw.x, fw.y));
  float glow = 1.0 - smoothstep(px, 6.0 * px, edge);
  color = mix(color, vColor, frameAlpha * 0.45 * glow);
  color = mix(color, vColor, frameAlpha * stroke);

  // the slogan, centered: cells shrink so the whole word fits inside 90% of the board
  if (count > 0) {
    float cell = min(0.55 * h, (0.9 * w) / float(count));
    float pitch = cell;
    float x0 = (w - float(count) * pitch) * 0.5;
    float pad = 0.5 * cell;
    float box = cell + 2.0 * pad;
    float vTop = h - v;
    float rowTop = (h - cell) * 0.5;
    int k = int(floor((u - x0) / pitch));
    vec3 coreColor = mix(vColor, vec3(1.0), 0.6);
    float brightness = 0.45 + 0.5 * r;

    for (int n = -1; n <= 1; n++) {
      int kk = k + n;
      if (kk < 0 || kk >= count) continue;

      vec2 g = vec2(u - x0 - float(kk) * pitch, vTop - rowTop);
      vec2 p = (g + pad) / box;
      if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) continue;

      float glyph = glyphAt(kk);
      color = mix(color, vColor, brightness * atlas(glyph, VARIANT_HALO, p));
      color = mix(color, coreColor, brightness * atlas(glyph, VARIANT_CORE, p));
    }
  }

  fragColor = vec4(color, 1.0);
}
