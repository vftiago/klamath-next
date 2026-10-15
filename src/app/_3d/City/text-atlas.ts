import { CanvasTexture, LinearFilter } from "three";

/** Atlas cell in px: the character cell plus a half-cell pad each side so halos don't clip. */
export const ATLAS_CELL = 64;
export const CHAR_CELL = 32;
export const ATLAS_COLUMNS = 16;
/** Variant bands: 0 = lit stroke with its wide halo, 1 = the thin bright core, 2 = unlit dim. */
export const ATLAS_VARIANTS = 3;

export type TextAtlas = {
  columns: number;
  /** Character -> cell index. */
  index: Map<string, number>;
  rows: number;
  texture: CanvasTexture;
};

/** Index of a character in the atlas, 0 (the first cell, always a blank) when unknown. */
export const glyphIndex = (atlas: TextAtlas, char: string): number => atlas.index.get(char) ?? 0;

/**
 * The CSS font stack for signage: the site's condensed display face (from next/font's CSS variable) for
 * Latin, with CJK system fonts behind it. Read at atlas build time, in the browser.
 */
export const resolveSignFont = (): string => {
  const variable = getComputedStyle(document.documentElement).getPropertyValue("--font-barlow-condensed").trim();
  const site = variable ? `${variable}, ` : "";
  return `${site}"Barlow Condensed", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Meiryo", "Noto Sans CJK JP", "Droid Sans Fallback", sans-serif`;
};

/**
 * Renders every character once into a grid of 16 columns, three variant bands tall, all in white: the
 * sign and billboard shaders tint per instance. Cell 0 is left blank for spaces and unknown characters.
 * Strokes and blur radii follow the reference's neon glyphs at a 32 px cell. Touches the DOM.
 */
export const createTextAtlas = (chars: Iterable<string>, fontFamily: string): TextAtlas => {
  const unique = [" ", ...new Set([...chars].filter((c) => c !== " "))];
  const rows = Math.max(1, Math.ceil(unique.length / ATLAS_COLUMNS));

  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_CELL * ATLAS_COLUMNS;
  canvas.height = ATLAS_CELL * rows * ATLAS_VARIANTS;

  const index = new Map<string, number>();
  unique.forEach((char, i) => index.set(char, i));

  const ctx = canvas.getContext("2d");

  if (ctx) {
    const pad = (ATLAS_CELL - CHAR_CELL) / 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const draw = (char: string, cell: number, variant: number, style: { alpha: number; blur: number }) => {
      const col = cell % ATLAS_COLUMNS;
      const row = Math.floor(cell / ATLAS_COLUMNS);
      const cx = col * ATLAS_CELL + pad + CHAR_CELL / 2;
      const cy = (variant * rows + row) * ATLAS_CELL + pad + CHAR_CELL / 2;

      ctx.save();
      ctx.font = `700 ${CHAR_CELL}px ${fontFamily}`;
      // squeeze wide characters into the cell
      const width = ctx.measureText(char).width;
      const squeeze = Math.min(1, (CHAR_CELL * 0.95) / Math.max(1, width));
      ctx.translate(cx, cy);
      ctx.scale(squeeze, 1);
      ctx.shadowColor = "rgba(255, 255, 255, 1)";
      ctx.shadowBlur = style.blur;
      ctx.fillStyle = `rgba(255, 255, 255, ${style.alpha})`;
      ctx.fillText(char, 0, 0);
      ctx.restore();
    };

    unique.forEach((char, cell) => {
      if (cell === 0) {
        return;
      }
      // lit pass 1: 95% with a wide halo; pass 2: bright core with a tight halo; unlit: dim, no halo
      draw(char, cell, 0, { alpha: 0.95, blur: 0.55 * CHAR_CELL });
      draw(char, cell, 1, { alpha: 1, blur: 0.2 * CHAR_CELL });
      draw(char, cell, 2, { alpha: 0.6, blur: 0 });
    });
  }

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;

  return { columns: ATLAS_COLUMNS, index, rows, texture };
};
