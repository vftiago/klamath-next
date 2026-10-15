import { CanvasTexture, LinearFilter } from "three";
import { mulberry32 } from "../../utils";

/** Texture pixels per reference pixel. */
export const STALL_RESOLUTION = 2;

export type StallCell = {
  /** Sprite height, reference px (the quad's height). */
  height: number;
  /** Where the stall's smoke rises from: left x and width relative to the sprite's left edge, and height. */
  smokeLeft: number;
  smokeWidth: number;
  smokeY: number;
  /** Stall body width, reference px (clusters are spaced by this, not the sprite width). */
  stallWidth: number;
  /** Texture rect, in [0, 1]. */
  uv: readonly [number, number, number, number];
  /** Sprite width, reference px, including the glow pad each side. */
  width: number;
};

export type StallSheet = {
  cells: StallCell[];
  texture: CanvasTexture;
};

const AMBER = [255, 176, 96] as const;
const LAVENDER = [236, 228, 255] as const;
const INK = [5, 1, 15] as const;
const WHITE = [255, 255, 255] as const;
const NEON = [
  [255, 45, 170],
  [40, 235, 255],
  [214, 255, 40],
  [255, 45, 170],
  [40, 235, 255],
] as const;

type Rgb = readonly [number, number, number];

const lerp = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];
const rgba = (c: Rgb, a = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;

/** Sprite headroom above the counter top for the awning, lanterns and glow. */
const HEADROOM = 44;

type StallPlan = {
  bodyHeight: number;
  counterHeight: number;
  rand: () => number;
  width: number;
};

/**
 * Draws one stall into the sheet at the given cell origin (texture px), ground at `groundY`. A direct
 * port of the reference painter: warm glow, gradient body, posts, curtains, counter, patrons on stools,
 * striped scalloped awning or a solid one with a glowing signboard, hanging bulbs and paper lanterns.
 */
const paintStall = (ctx: CanvasRenderingContext2D, plan: StallPlan, originX: number, groundY: number) => {
  const { bodyHeight: l, counterHeight: r, rand: a, width: t } = plan;
  const x = originX;
  const d = groundY;
  const n = d - l;
  const i = d - r;
  const s = x + t / 2;
  const o: Rgb = a() < 0.75 ? AMBER : LAVENDER;

  // warm glow behind the stall
  const glow = ctx.createRadialGradient(s, d - 0.45 * l, 0, s, d - 0.45 * l, 0.95 * t);
  glow.addColorStop(0, rgba(o, 0.24));
  glow.addColorStop(1, rgba(o, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(s - t, d - 0.45 * l - t, 2 * t, 2 * t);

  // body and posts
  const body = ctx.createLinearGradient(0, n, 0, i);
  body.addColorStop(0, rgba(lerp(o, WHITE, 0.25), 0.85));
  body.addColorStop(1, rgba(lerp(o, [120, 40, 40], 0.55), 0.8));
  ctx.fillStyle = body;
  ctx.fillRect(x + 3, n, t - 6, i - n);
  ctx.fillStyle = rgba(INK);
  ctx.fillRect(x + 2, n, 2, l);
  ctx.fillRect(x + t - 4, n, 2, l);

  // curtains with a light slit
  const curtainRoll = a();
  const curtain: Rgb = curtainRoll < 0.55 ? [36, 34, 96] : curtainRoll < 0.6 ? [150, 26, 40] : [24, 20, 30];
  const panels = 3 + Math.floor(2 * a());
  const curtainH = (i - n) * (0.38 + 0.12 * a());
  const panelW = (t - 8) / panels;
  for (let p = 0; p < panels; p++) {
    const px = x + 4 + p * panelW;
    ctx.fillStyle = rgba(curtain, 0.96);
    ctx.fillRect(px + 0.6, n, panelW - 1.2, curtainH);
    ctx.fillStyle = "rgba(240, 232, 220, 0.5)";
    ctx.fillRect(px + panelW / 2 - 0.6, n + 0.3 * curtainH, 1.2, 0.4 * curtainH);
    if (p % 2 === 0) {
      ctx.fillRect(px + panelW / 2 - 2, n + 0.45 * curtainH, 4, 1);
    }
  }

  // counter
  ctx.fillStyle = rgba(lerp(INK, [60, 20, 30], 0.35));
  ctx.fillRect(x, i, t, r);
  ctx.fillStyle = rgba(o, 0.75);
  ctx.fillRect(x, i, t, 1);

  // patrons on stools: seat, leg, torso, head
  const patrons = Math.floor(3 * a());
  ctx.fillStyle = "rgb(8, 3, 16)";
  for (let k = 0; k < patrons; k++) {
    const px = x + t * (0.25 + (k / Math.max(1, patrons)) * 0.55) + (a() - 0.5) * 6;
    const py = d - 8;
    ctx.fillRect(px - 3, py, 6, 1.5);
    ctx.fillRect(px - 0.5, py, 1, 8);
    ctx.beginPath();
    ctx.moveTo(px - 4.5, py);
    ctx.lineTo(px - 4, py - 11);
    ctx.quadraticCurveTo(px, py - 14, px + 4, py - 11);
    ctx.lineTo(px + 4.5, py);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + (a() - 0.5), py - 16.5, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // awning
  const v = 9 + 4 * a();
  if (a() < 0.55) {
    // striped scallops in a neon color alternating with a pale stripe
    const neon = NEON[Math.floor(a() * NEON.length)] ?? NEON[0];
    const stripes = Math.max(4, Math.round(t / 9));
    const stripeW = (t + 8) / stripes;
    for (let k = 0; k < stripes; k++) {
      const sx = x - 4 + k * stripeW;
      ctx.fillStyle = k % 2 ? rgba(lerp(neon, INK, 0.5)) : rgba(lerp([226, 214, 222], INK, 0.42));
      ctx.beginPath();
      ctx.moveTo(sx + 3, n - v);
      ctx.lineTo(sx + stripeW + 3, n - v);
      ctx.lineTo(sx + stripeW, n);
      ctx.lineTo(sx, n);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx + stripeW / 2, n, stripeW / 2, 0, Math.PI);
      ctx.fill();
    }
  } else {
    // solid awning with a glowing signboard and three dark glyph bars
    ctx.fillStyle = rgba(lerp(INK, [70, 36, 30], 0.4));
    ctx.beginPath();
    ctx.moveTo(x - 5, n);
    ctx.lineTo(x + t + 5, n);
    ctx.lineTo(x + t - 4, n - v);
    ctx.lineTo(x + 4, n - v);
    ctx.closePath();
    ctx.fill();
    const signColor: Rgb = a() < 0.5 ? o : (NEON[Math.floor(a() * NEON.length)] ?? NEON[0]);
    const signW = 0.5 * t;
    const signH = 0.6 * v;
    ctx.save();
    ctx.shadowColor = rgba(signColor);
    ctx.shadowBlur = 6 * STALL_RESOLUTION;
    ctx.fillStyle = rgba(lerp(signColor, WHITE, 0.3), 0.9);
    ctx.fillRect(s - signW / 2, n - 0.8 * v, signW, signH);
    ctx.restore();
    ctx.fillStyle = "rgba(40, 10, 20, 0.8)";
    for (let k = 0; k < 3; k++) {
      ctx.fillRect(s - 0.35 * signW + k * signW * 0.28, n - 0.7 * v, 0.14 * signW, 0.6 * signH);
    }
  }

  // hanging bulbs along the front
  const bulbs = Math.max(3, Math.round(t / 16));
  for (let k = 0; k < bulbs; k++) {
    const bx = x + 4 + ((t - 8) / bulbs) * (k + 0.5);
    const by = n + 7 + 2 * Math.sin(((k + 0.5) / bulbs) * Math.PI);
    const halo = ctx.createRadialGradient(bx, by, 0, bx, by, 5);
    halo.addColorStop(0, "rgba(255, 226, 170, 0.6)");
    halo.addColorStop(1, "rgba(255, 226, 170, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(bx - 5, by - 5, 10, 10);
    ctx.fillStyle = "rgb(255, 240, 210)";
    ctx.beginPath();
    ctx.arc(bx, by, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // paper lanterns on the posts
  if (a() < 0.6) {
    for (const lx of [x + 2, x + t - 2]) {
      const ly = n + 11;
      ctx.fillStyle = "rgba(20, 8, 12, 0.9)";
      ctx.fillRect(lx - 0.4, n, 0.8, 6);
      const halo = ctx.createRadialGradient(lx, ly, 0, lx, ly, 11);
      halo.addColorStop(0, "rgba(255, 110, 70, 0.4)");
      halo.addColorStop(1, "rgba(255, 110, 70, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(lx - 11, ly - 11, 22, 22);
      const paper = ctx.createRadialGradient(lx - 1, ly - 1, 0.5, lx, ly, 5);
      paper.addColorStop(0, "rgb(255, 214, 150)");
      paper.addColorStop(0.6, "rgb(232, 80, 52)");
      paper.addColorStop(1, "rgb(140, 24, 34)");
      ctx.fillStyle = paper;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 3.6, 4.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(30, 8, 12, 0.95)";
      ctx.fillRect(lx - 1.8, ly - 5.6, 3.6, 1.2);
      ctx.fillRect(lx - 1.8, ly + 4.4, 3.6, 1.2);
    }
  }
};

/**
 * Paints `count` stall variants into one sprite sheet (one row, cells of varying width). Deterministic for
 * the seed; touches the DOM, so build it in a state initializer.
 */
export const createStallSheet = (count = 10, seed = 2027): StallSheet => {
  const rand = mulberry32(seed);
  const plans: StallPlan[] = Array.from({ length: count }, (_, k) => ({
    bodyHeight: 40 + 12 * rand(),
    counterHeight: 13 + 3 * rand(),
    rand: mulberry32(seed + 17 * k + 1),
    width: 50 + 46 * rand(),
  }));

  // the glow extends about one stall width around the center: pad half a width on each side
  const cellWidth = (plan: StallPlan) => plan.width * 2;
  const cellHeight = (plan: StallPlan) => plan.bodyHeight + HEADROOM;

  const sheetWidth = plans.reduce((sum, plan) => sum + cellWidth(plan), 0);
  const sheetHeight = Math.max(...plans.map(cellHeight));

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(sheetWidth * STALL_RESOLUTION);
  canvas.height = Math.ceil(sheetHeight * STALL_RESOLUTION);

  const ctx = canvas.getContext("2d");
  const cells: StallCell[] = [];
  let cursor = 0;

  for (const plan of plans) {
    const width = cellWidth(plan);
    const padX = (width - plan.width) / 2;

    if (ctx) {
      ctx.save();
      ctx.scale(STALL_RESOLUTION, STALL_RESOLUTION);
      ctx.beginPath();
      ctx.rect(cursor, 0, width, sheetHeight);
      ctx.clip();
      // the ground sits at the bottom of the sheet; shorter cells are simply transparent above their art
      paintStall(ctx, plan, cursor + padX, sheetHeight);
      ctx.restore();
    }

    cells.push({
      height: sheetHeight,
      smokeLeft: padX + 0.2 * plan.width,
      smokeWidth: 0.6 * plan.width,
      smokeY: plan.counterHeight + 2,
      stallWidth: plan.width,
      uv: [cursor / sheetWidth, 0, (cursor + width) / sheetWidth, 1],
      width,
    });

    cursor += width;
  }

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;

  return { cells, texture };
};
