import { CanvasTexture, LinearFilter } from "three";
import { mulberry32 } from "../../utils";
import { GLYPH_COUNT, GLYPHS } from "./glyphs";

/** Atlas cell in px. It covers the glyph cell plus a half-cell pad on each side, as in the reference. */
export const ATLAS_CELL = 64;
/** Glyph cell size inside an atlas cell; the pad is (ATLAS_CELL - GLYPH_CELL) / 2. */
export const GLYPH_CELL = 32;
export const ATLAS_ROWS = 3;

/** Atlas rows: 0 = lit stroke with its wide halo, 1 = the thin bright core, 2 = unlit dim stroke. */
export const ROW_HALO = 0;
export const ROW_CORE = 1;
export const ROW_UNLIT = 2;

/**
 * Renders the 16 glyphs in white into a 16 x 3 atlas; the shader tints them with each sign's color.
 * Strokes and blur radii follow the reference at a 32 px cell. Deterministic (seeded jitter), touches the
 * DOM, so create it outside render.
 */
export const createGlyphAtlas = (): CanvasTexture => {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_CELL * GLYPH_COUNT;
  canvas.height = ATLAS_CELL * ATLAS_ROWS;

  const ctx = canvas.getContext("2d");

  if (ctx) {
    const pad = (ATLAS_CELL - GLYPH_CELL) / 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    GLYPHS.forEach((strokes, glyph) => {
      // per-glyph jitter, seeded like the reference so the same glyph always wobbles the same way
      const rand = mulberry32(7919 * glyph + 17);
      const jittered = strokes.map((stroke) =>
        stroke.map(([x, y]) => [x + (rand() - 0.5) * 0.05, y + (rand() - 0.5) * 0.05] as const),
      );

      const trace = (row: number) => {
        const ox = glyph * ATLAS_CELL + pad;
        const oy = row * ATLAS_CELL + pad;
        ctx.beginPath();
        for (const stroke of jittered) {
          stroke.forEach(([x, y], i) => {
            if (i === 0) {
              ctx.moveTo(ox + x * GLYPH_CELL, oy + y * GLYPH_CELL);
            } else {
              ctx.lineTo(ox + x * GLYPH_CELL, oy + y * GLYPH_CELL);
            }
          });
        }
      };

      // lit pass 1: stroke at 95% with a wide halo
      ctx.save();
      ctx.shadowColor = "rgba(255, 255, 255, 1)";
      ctx.shadowBlur = 0.55 * GLYPH_CELL;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = Math.max(1.6, 0.12 * GLYPH_CELL);
      trace(ROW_HALO);
      ctx.stroke();
      ctx.restore();

      // lit pass 2: thin bright core with a tight halo
      ctx.save();
      ctx.shadowColor = "rgba(255, 255, 255, 1)";
      ctx.shadowBlur = 0.2 * GLYPH_CELL;
      ctx.strokeStyle = "rgba(255, 255, 255, 1)";
      ctx.lineWidth = Math.max(0.8, 0.045 * GLYPH_CELL);
      trace(ROW_CORE);
      ctx.stroke();
      ctx.restore();

      // unlit: dim stroke, no halo
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = Math.max(1.4, 0.1 * GLYPH_CELL);
      trace(ROW_UNLIT);
      ctx.stroke();
      ctx.restore();
    });
  }

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;

  return texture;
};
