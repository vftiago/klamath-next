import { CanvasTexture, LinearFilter } from "three";

/** Texture size in px; the badge is drawn with its glow pad so the ring and halo aren't clipped. */
export const BADGE_TEXTURE_SIZE = 256;
/** Fraction of the texture taken by the badge radius (the rest is pad for rings and glow). */
export const BADGE_RADIUS_FRACTION = 0.36;

const CYAN = "110, 236, 255";
const PINK = "255, 60, 180";

/** The site logo, from public/logo.svg (1024 viewBox): a stroked triangle, a bar and a block. */
const LOGO_TRIANGLE =
  "M518.923 922.351a8 8 0 0 1-13.993 0L54.818 110.163a8 8 0 0 1 7-11.878l900.371.082a8 8 0 0 1 7 11.879Z";
const LOGO_BLOCK = "M512 359h300v100H512z";
const LOGO_BAR = "M462.015 98.009h100v800h-100z";

/**
 * Hovering badge for the rooftop searchlight: the site logo in neon pink inside a cyan ring with tick
 * marks, in the spirit of the reference's hovering brand mark. Drawn once; touches the DOM.
 */
export const createBadgeTexture = (): CanvasTexture => {
  const canvas = document.createElement("canvas");
  canvas.width = BADGE_TEXTURE_SIZE;
  canvas.height = BADGE_TEXTURE_SIZE;

  const ctx = canvas.getContext("2d");

  if (ctx) {
    const c = BADGE_TEXTURE_SIZE / 2;
    const r = BADGE_TEXTURE_SIZE * BADGE_RADIUS_FRACTION;

    // dim disk
    ctx.fillStyle = `rgba(${CYAN}, 0.08)`;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.fill();

    // main ring with glow, then a faint outer ring
    ctx.save();
    ctx.shadowColor = `rgba(${CYAN}, 1)`;
    ctx.shadowBlur = 0.14 * r;
    ctx.strokeStyle = `rgba(${CYAN}, 0.85)`;
    ctx.lineWidth = 0.035 * r;
    ctx.beginPath();
    ctx.arc(c, c, r + 0.04 * r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = `rgba(${CYAN}, 0.3)`;
    ctx.lineWidth = 0.02 * r;
    ctx.beginPath();
    ctx.arc(c, c, r + 0.14 * r, 0, Math.PI * 2);
    ctx.stroke();

    // 48 ticks, every fourth longer and brighter
    for (let t = 0; t < 48; t++) {
      const angle = (t / 48) * Math.PI * 2;
      const major = t % 4 === 0;
      const inner = r + 0.2 * r;
      const outer = inner + (major ? 0.12 : 0.06) * r;
      ctx.strokeStyle = `rgba(${CYAN}, ${major ? 0.55 : 0.3})`;
      ctx.lineWidth = 0.02 * r;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(angle) * inner, c + Math.sin(angle) * inner);
      ctx.lineTo(c + Math.cos(angle) * outer, c + Math.sin(angle) * outer);
      ctx.stroke();
    }

    // logo: fit the 1024 viewBox into ~1.3r, centered; pink glow pass then a bright core pass
    const logoSize = 1.3 * r;
    const scale = logoSize / 1024;
    const triangle = new Path2D(LOGO_TRIANGLE);
    const block = new Path2D(LOGO_BLOCK);
    const bar = new Path2D(LOGO_BAR);

    const drawLogo = (fill: string, stroke: string, glow: number) => {
      ctx.save();
      ctx.translate(c - logoSize / 2, c - logoSize / 2);
      ctx.scale(scale, scale);
      ctx.shadowColor = `rgba(${PINK}, 1)`;
      ctx.shadowBlur = glow / scale;
      ctx.lineWidth = 100;
      ctx.lineJoin = "round";
      ctx.strokeStyle = stroke;
      ctx.fillStyle = fill;
      ctx.stroke(triangle);
      ctx.fill(block);
      ctx.fill(bar);
      ctx.restore();
    };

    drawLogo(`rgba(255, 110, 205, 0.9)`, `rgba(255, 110, 205, 0.9)`, 0.28 * r);
    drawLogo("rgb(255, 240, 252)", "rgb(255, 240, 252)", 0.07 * r);
  }

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;

  return texture;
};
