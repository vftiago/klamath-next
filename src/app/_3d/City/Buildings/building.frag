// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

uniform float uTime;
// layer depth: 0 = farthest, 1 = nearest
uniform float uR;
uniform float uLayer;
uniform float uIsNear;
uniform float uLit;
uniform float uGlow;
uniform float uHaze;
uniform float uTop;
// world units per reference pixel at this layer
uniform float uPx;
uniform float uGround;
// skyline height at this layer, world units
uniform float uSkylineH;
// window cell: width, gapX, height, gapY (world units)
uniform vec4 uCell;
uniform float uMargin;
uniform float uBottomReserve;
uniform float uGlowPad;
uniform float uEdgeLine;
uniform float uFloorLines;
uniform float uSideLines;

in vec3 vLocal;
in vec3 vNormal;
in float vWorldY;
flat in vec3 vSize;
flat in float vSeed;
flat in float vPattern;
flat in float vFrame;
flat in float vCameraSide;
flat in vec4 vRands;

out vec4 fragColor;

const vec3 BASE_FAR = vec3(26.0, 4.0, 51.0) / 255.0;
const vec3 BASE_NEAR = vec3(5.0, 1.0, 15.0) / 255.0;
const vec3 UNLIT = vec3(170.0, 150.0, 220.0) / 255.0;
const float UNLIT_ALPHA = 0.035;
const vec3 FLOOR_LINE = vec3(220.0, 200.0, 255.0) / 255.0;
const vec3 SIDE_LINE = vec3(210.0, 190.0, 255.0) / 255.0;
const vec3 WASH = vec3(255.0, 80.0, 170.0) / 255.0;
const vec3 HAZE = vec3(200.0, 70.0, 170.0) / 255.0;
// weighted mean of the window palette, used when cells shrink below the pixel footprint
const vec3 MEAN_TINT = vec3(238.0, 200.0, 174.0) / 255.0;

const vec3 NEON_PINK = vec3(255.0, 45.0, 170.0) / 255.0;
const vec3 NEON_CYAN = vec3(40.0, 235.0, 255.0) / 255.0;
const vec3 NEON_LIME = vec3(214.0, 255.0, 40.0) / 255.0;

float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

// weighted window palette from the reference (10 slots)
vec3 windowTint(float h) {
  float i = floor(h * 10.0);
  if (i < 3.0) return vec3(255.0, 196.0, 120.0) / 255.0;
  if (i < 4.0) return vec3(255.0, 180.0, 110.0) / 255.0;
  if (i < 6.0) return vec3(255.0, 214.0, 160.0) / 255.0;
  if (i < 8.0) return vec3(236.0, 230.0, 255.0) / 255.0;
  if (i < 9.0) return vec3(120.0, 226.0, 240.0) / 255.0;
  return vec3(255.0, 120.0, 196.0) / 255.0;
}

vec3 neonColor(float h) {
  float i = floor(h * 5.0);
  if (i == 2.0) return NEON_LIME;
  if (i == 1.0 || i == 4.0) return NEON_CYAN;
  return NEON_PINK;
}

// Fraction of a pixel footprint of width fw, centered at x, that lies inside the segment [0, len].
// Exact box filtering for an axis-aligned rectangle when fw is smaller than the gap to the next cell.
float segCoverage(float x, float len, float fw) {
  float lo = max(x - 0.5 * fw, 0.0);
  float hi = min(x + 0.5 * fw, len);
  return clamp((hi - lo) / max(fw, 1e-5), 0.0, 1.0);
}

// A window flips state once per hashed period (60-400 s); together with the hashed base state this gives
// ~0.5% of windows flipping per second, the reference's rate, with no CPU work.
float windowLit(vec3 id, float litProbability) {
  float base = step(hash(id + 1.0), litProbability);
  float period = 60.0 + 340.0 * hash(id + 2.0);
  float phase = hash(id + 3.0) * period;
  float flips = floor((uTime + phase) / period);
  float flipped = mod(flips, 2.0);
  return abs(base - flipped);
}

// Window grid contribution at front-face coords (u from left, v from top) as (rgb, alpha) to composite
// over the wall. fw is the pixel footprint in face units; cells are box-filtered against it, and the whole
// grid fades to its statistical mean once a pixel spans most of a cell pitch.
vec4 windows(float u, float v, vec2 fw) {
  float L = uCell.x;
  float T = uCell.y;
  float I = uCell.z;
  float O = uCell.w;
  float E = uMargin;
  float W = vSize.x - 2.0 * E;
  float topMargin = E + 2.0 * uPx;
  float bottomLimit = vSize.y - uBottomReserve;

  float cellW;
  float cellH;
  float pitchX;
  float pitchY;
  float x0;
  float columns;
  float litProbability = uLit;
  float alphaScale = 1.0;
  float alphaBase = 0.45;
  float rowActiveProbability = 1.0;

  if (vPattern < 0.5) {
    cellW = L;
    cellH = I;
    pitchX = L + T;
    pitchY = I + O;
    columns = max(1.0, floor((W + T) / pitchX));
    x0 = (vSize.x - (columns * pitchX - T)) * 0.5;
    rowActiveProbability = 0.82;
  } else if (vPattern < 1.5) {
    cellW = W;
    cellH = max(uPx, I - uPx);
    pitchX = W + 1.0;
    pitchY = I + O;
    columns = 1.0;
    x0 = E;
    litProbability = min(1.0, uLit * 1.4);
    alphaScale = 0.5;
    alphaBase = 0.5;
  } else {
    cellW = max(uPx, floor(0.6 * L / uPx + 0.5) * uPx);
    float gap = 1.8 * T;
    pitchX = cellW + gap;
    cellH = 2.0 * I + O;
    pitchY = 2.0 * (I + O);
    columns = max(1.0, floor((W + gap) / pitchX));
    x0 = (vSize.x - (columns * pitchX - gap)) * 0.5;
  }

  float cu = u - x0;
  float cv = v - topMargin;
  float col = floor(cu / pitchX);
  float row = floor(cv / pitchY);

  if (col < 0.0 || col >= columns || row < 0.0 || topMargin + row * pitchY + cellH > bottomLimit) {
    return vec4(0.0);
  }

  float inU = cu - col * pitchX;
  float inV = cv - row * pitchY;
  float pad = uGlowPad;

  vec3 id = vec3(vSeed, col, row);
  float rowActive = vPattern < 0.5 ? step(hash(vec3(vSeed, row, 999.0)), rowActiveProbability) : 1.0;
  float lit = windowLit(id, litProbability) * rowActive;
  vec3 tint = windowTint(hash(id + 4.0));
  float a = uGlow * (alphaBase + (1.0 - alphaBase) * hash(id + 5.0)) * alphaScale;

  // exact coverage of this cell (and its glow pad) by the pixel footprint
  float covCell = segCoverage(inU, cellW, fw.x) * segCoverage(inV, cellH, fw.y);
  float covPad = segCoverage(inU + pad, cellW + 2.0 * pad, fw.x) * segCoverage(inV + pad, cellH + 2.0 * pad, fw.y);

  vec3 cellColor;
  float cellAlpha;
  if (lit > 0.5) {
    cellColor = tint;
    cellAlpha = covCell * a + (covPad - covCell) * 0.2 * a;
  } else {
    cellColor = UNLIT;
    cellAlpha = covCell * UNLIT_ALPHA;
  }

  // statistical mean of the grid for footprints that span several cells
  float duty = (cellW / pitchX) * (cellH / pitchY) * rowActiveProbability;
  float meanA = uGlow * (alphaBase + (1.0 - alphaBase) * 0.5) * alphaScale;
  float meanLitAlpha = litProbability * duty * meanA;
  float meanUnlitAlpha = (1.0 - litProbability) * duty * UNLIT_ALPHA;
  float meanAlpha = meanLitAlpha + meanUnlitAlpha;
  vec3 meanColor = (MEAN_TINT * meanLitAlpha + UNLIT * meanUnlitAlpha) / max(meanAlpha, 1e-5);

  float lod = max(fw.x / pitchX, fw.y / pitchY);
  float t = smoothstep(0.35, 1.0, lod);

  return vec4(mix(cellColor, meanColor, t), mix(cellAlpha, meanAlpha, t));
}

void main(void) {
  vec3 base = mix(BASE_FAR, BASE_NEAR, uR);
  vec3 color = base;

  bool front = vNormal.z > 0.5;
  bool side = abs(vNormal.x) > 0.5;

  if (front) {
    float u = vLocal.x + vSize.x * 0.5;
    float v = vSize.y - vLocal.y;
    vec2 fw = fwidth(vec2(u, v));

    vec4 win = windows(u, v, fw);
    color = mix(color, win.rgb, win.a);

    // faint floor lines on the nearest layers, every three window rows
    if (uFloorLines > 0.5) {
      float pitch = (uCell.z + uCell.w) * 3.0;
      float y = v - (uMargin + 2.0 * uPx) - 12.0 * uPx;
      if (y > 0.0 && v < vSize.y - 12.0 * uPx) {
        color = mix(color, FLOOR_LINE, 0.045 * segCoverage(mod(y, pitch), uPx, fw.y));
      }
    }

    // vertical neon edge line on the side facing the camera (layers >= 2)
    if (uEdgeLine > 0.5 && vFrame < 0.5) {
      float edgeU = vCameraSide > 0.0 ? vSize.x - u : u;
      color = mix(color, neonColor(vRands.z), (0.1 + 0.2 * uR) * segCoverage(edgeU, uPx, fw.x));
    }
  } else if (side) {
    color = mix(base, vec3(0.0), 0.42);

    if (uSideLines > 0.5) {
      float pitch = (uCell.z + uCell.w) * 3.0;
      float v = vSize.y - vLocal.y - 12.0 * uPx;
      float fwv = fwidth(v);
      if (v > 0.0) {
        color = mix(color, SIDE_LINE, (0.05 + 0.04 * uR) * segCoverage(mod(v, pitch), uPx, fwv));
      }
    }
  }

  // pink wash rising from the ground
  float washAmt = (0.06 + 0.16 * uR) * clamp(1.0 - (vWorldY - uGround) / (0.45 * uSkylineH), 0.0, 1.0);
  color = mix(color, WASH, washAmt);

  // darken toward the top of the skyline on nearer layers (silhouette against the sky)
  if (uR > 0.4) {
    float t = clamp(1.0 - (uGround + uSkylineH - vWorldY) / (0.5 * uSkylineH), 0.0, 1.0);
    color = mix(color, vec3(0.0), 0.3 * uR * t);
  }

  // pink haze toward the base of far layers
  if (uHaze > 0.0) {
    float hazeTop = uGround + uSkylineH * uTop + 40.0 * uPx;
    float hazeAmt = uHaze * clamp((hazeTop - vWorldY) / (uSkylineH * uTop + 40.0 * uPx), 0.0, 1.0);
    color = mix(color, HAZE, hazeAmt);
  }

  fragColor = vec4(color, 1.0);
}
