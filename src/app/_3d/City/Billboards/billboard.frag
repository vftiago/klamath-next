// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

uniform sampler2D uAtlas;
// atlas grid: columns, rows per variant band
uniform vec2 uAtlasGrid;

in vec2 vLocal;
flat in vec4 vSize;
flat in vec3 vColor;
flat in vec3 vBacking;
flat in vec4 vLayer;
flat in vec4 vGlyphs0;
flat in vec4 vGlyphs1;
flat in vec4 vGlyphs2;
flat in vec4 vShine;

out vec4 fragColor;

const float ATLAS_VARIANTS = 3.0;
// must match GLYPH_PITCH in generate.ts
const float GLYPH_PITCH = 1.18;
const vec3 UNLIT_DARK = vec3(36.0, 26.0, 48.0) / 255.0;
// border halo reach either side of the tube, in character cells (the text's atlas halo is also a cell fraction)
const float BORDER_HALO_CELLS = 0.28;
const float VARIANT_HALO = 0.0;
const float VARIANT_CORE = 1.0;


// signed distance from p (board coords) to a `size` rounded rect with corner radius r, negative inside
float roundedBox(vec2 p, vec2 size, float r) {
  vec2 ext = 0.5 * size;
  r = min(r, min(ext.x, ext.y));
  vec2 q = abs(p - ext) - (ext - r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

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
  float px = vLayer.y;
  int count = int(vLayer.z + 0.5);
  float cell = vLayer.w;

  // distance inside the rounded board; nothing outside it
  float edge = -roundedBox(vec2(u, v), vec2(w, h), vSize.z);
  if (edge < 0.0) discard;

  vec3 color = vBacking;

  vec3 coreColor = mix(vColor, vec3(1.0), 0.6);
  vec3 unlitColor = mix(vColor, UNLIT_DARK, 0.72);
  float coreShine = vShine.x;
  float haloShine = vShine.y;
  float textShine = vShine.z;
  // the row's dim factor, from the billboard type's `dim` pair
  float brightness = vShine.w;

  // neon tube frame, the same rule as the signs: inset by min(2 px, m / 2) or enough to keep the tube inside,
  // a dark tube under a soft halo either side and a bright core; m is the board margin (half of h - cell) and
  // d the signed distance to the tube's centre line
  float m = 0.5 * (h - cell);
  float tubeW = min(vSize.w, m);
  float inset = max(min(2.0 * px, 0.5 * m), 0.5 * tubeW);
  float d = edge - inset;
  float tube = segCoverage(d + 0.5 * tubeW, tubeW, max(fw.x, fw.y));
  // the halo shrinks with the board like the slogan's, and never reaches past the margin
  float haloReach = min(BORDER_HALO_CELLS * cell, m);
  // a tube thinner than a pixel glows less, and no tube glows not at all
  float halo = pow(1.0 - smoothstep(0.0, haloReach, abs(d)), 2.0) * min(1.0, tubeW / px);
  color = mix(color, unlitColor, tube * brightness);
  color = mix(color, vColor, min(1.0, haloShine * brightness * halo));
  color = mix(color, coreColor, min(1.0, coreShine * brightness * tube));

  // the slogan at the size the generator built the board around, centered
  if (count > 0) {
    float pitch = GLYPH_PITCH * cell;
    float x0 = (w - (float(count - 1) * pitch + cell)) * 0.5;
    float pad = 0.5 * cell;
    float box = cell + 2.0 * pad;
    float vTop = h - v;
    float rowTop = (h - cell) * 0.5;
    int k = int(floor((u - x0) / pitch));

    for (int n = -1; n <= 1; n++) {
      int kk = k + n;
      if (kk < 0 || kk >= count) continue;

      vec2 g = vec2(u - x0 - float(kk) * pitch, vTop - rowTop);
      vec2 p = (g + pad) / box;
      if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) continue;

      float glyph = glyphAt(kk);
      color = mix(color, vColor, min(1.0, textShine * brightness * atlas(glyph, VARIANT_HALO, p)));
      color = mix(color, coreColor, min(1.0, textShine * brightness * atlas(glyph, VARIANT_CORE, p)));
    }
  }

  fragColor = vec4(color, 1.0);
}
