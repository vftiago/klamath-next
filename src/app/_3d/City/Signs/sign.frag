// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

uniform sampler2D uAtlas;
// atlas grid: columns, rows per variant band
uniform vec2 uAtlasGrid;

in vec2 vLocal;
flat in vec2 vSize;
flat in vec3 vColor;
flat in vec3 vBacking;
flat in vec4 vParams;
flat in vec4 vGlyphs0;
flat in vec4 vGlyphs1;
flat in vec4 vGlyphs2;
flat in vec4 vMeta;
flat in vec2 vState;
flat in vec4 vShine;

out vec4 fragColor;

const float ATLAS_VARIANTS = 3.0;
const float VARIANT_HALO = 0.0;
const float VARIANT_CORE = 1.0;
const float VARIANT_UNLIT = 2.0;
const float GLYPH_PITCH = 1.18;
// border halo reach either side of the tube, in character cells (the text's atlas halo is also a cell fraction)
const float BORDER_HALO_CELLS = 0.28;

const vec3 UNLIT_DARK = vec3(36.0, 26.0, 48.0) / 255.0;

// signed distance from p (box coords) to a `size` rounded rect with corner radius r, negative inside
float roundedBox(vec2 p, vec2 size, float r) {
  vec2 ext = 0.5 * size;
  r = min(r, min(ext.x, ext.y));
  vec2 q = abs(p - ext) - (ext - r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

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

// alpha of one variant of an atlas cell, p in [0, 1]^2 inside the padded cell (y down)
float atlas(float glyph, float variant, vec2 p) {
  float col = mod(glyph, uAtlasGrid.x);
  float row = floor(glyph / uAtlasGrid.x);
  vec2 uv = vec2((col + p.x) / uAtlasGrid.x, 1.0 - (variant * uAtlasGrid.y + row + p.y) / (ATLAS_VARIANTS * uAtlasGrid.y));
  return texture(uAtlas, uv).a;
}

void main(void) {
  float w = vSize.x;
  float h = vSize.y;
  float u = vLocal.x;
  float vTop = h - vLocal.y;
  vec2 fw = fwidth(vLocal);
  float fwMax = max(fw.x, fw.y);

  float cell = vParams.x;
  float m = vParams.y;
  bool vertical = vParams.z > 0.5;
  int count = int(vParams.w + 0.5);
  float dim = vMeta.x;
  int dead = int(vMeta.y);
  float px = vMeta.z;
  float radius = vMeta.w;
  float level = vState.x;
  int offGlyph = int(vState.y);

  // brightness after the layer's dim factor
  float i = level * dim;

  // nothing outside the rounded box
  if (roundedBox(vec2(u, vTop), vec2(w, h), radius) > 0.0) discard;

  vec3 color = vBacking;
  vec3 unlitColor = mix(vColor, UNLIT_DARK, 0.72);
  vec3 coreColor = mix(vColor, vec3(1.0), 0.7);
  float coreShine = vShine.x;
  float haloShine = vShine.y;
  float textShine = vShine.z;

  // neon tube frame concentric with the box, inset by min(2 px, m / 2) or enough to keep the tube inside, lit
  // like the text: a dark tube when unlit, a soft halo falling off either side of it, and a bright core; d is
  // the signed distance to the tube's centre line, positive inside
  float tubeW = min(vShine.w, m);
  float inset = max(min(2.0 * px, 0.5 * m), 0.5 * tubeW);
  float d = -roundedBox(vec2(u - inset, vTop - inset), vec2(w, h) - 2.0 * inset, max(0.0, radius - inset));
  // the halo shrinks with the sign like the text's, and never reaches past the margin into the letters
  float haloReach = min(BORDER_HALO_CELLS * cell, m);
  float tube = segCoverage(d + 0.5 * tubeW, tubeW, fwMax);
  // a tube thinner than a pixel glows less, and no tube glows not at all
  float halo = pow(1.0 - smoothstep(0.0, haloReach, abs(d)), 2.0) * min(1.0, tubeW / px);
  color = mix(color, unlitColor, tube * dim);
  color = mix(color, vColor, min(1.0, haloShine * i * halo));
  color = mix(color, coreColor, min(1.0, coreShine * i * tube));

  // character cells run along the sign; each atlas cell is padded by half a cell so halos overlap
  float pitch = GLYPH_PITCH * cell;
  float pad = ceil(0.5 * cell / px) * px;
  float box = cell + 2.0 * pad;
  float along = vertical ? vTop - m : u - m;
  float across = vertical ? u - m : vTop - m;
  int k = int(floor(along / pitch));

  for (int n = -1; n <= 1; n++) {
    int kk = k + n;
    if (kk < 0 || kk >= count) continue;

    float la = along - float(kk) * pitch;
    vec2 g = vertical ? vec2(across, la) : vec2(la, across);
    vec2 p = (g + pad) / box;
    if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) continue;

    float glyph = glyphAt(kk);

    float unlitA = atlas(glyph, VARIANT_UNLIT, p);
    color = mix(color, unlitColor, unlitA * dim);

    if (kk == dead) continue;

    float f = i;
    if (kk == offGlyph) f *= 0.04;
    if (f < 0.03) continue;

    float haloA = atlas(glyph, VARIANT_HALO, p);
    float coreA = atlas(glyph, VARIANT_CORE, p);
    color = mix(color, vColor, min(1.0, textShine * f * haloA));
    color = mix(color, coreColor, min(1.0, textShine * f * coreA));
  }

  fragColor = vec4(color, 1.0);
}
