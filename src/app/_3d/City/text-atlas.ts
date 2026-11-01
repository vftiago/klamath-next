import { CanvasTexture, LinearFilter } from "three";
import { LOGO_GLYPHS } from "./logos";

/** CJK ideographs, kana and full-width forms: drawn by the fallback stack, centred on an ideograph's body. */
const CJK = /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/;

/** Atlas cell in px: the character cell plus a half-cell pad each side so halos don't clip. */
export const ATLAS_CELL = 64;
export const CHAR_CELL = 32;
export const ATLAS_COLUMNS = 16;
/** Variant bands: 0 = lit stroke with its wide halo, 1 = the thin bright core, 2 = unlit dim. */
export const ATLAS_VARIANTS = 3;
/** Side of the square a logo glyph is fitted in, px: a touch over the Latin cap height so marks read as big as words. */
const LOGO_SIZE = 0.8 * CHAR_CELL;

export type TextAtlas = {
  columns: number;
  /** Character -> cell index. */
  index: Map<string, number>;
  rows: number;
  texture: CanvasTexture;
};

/** Index of a character in the atlas, 0 (the first cell, always a blank) when unknown. */
export const glyphIndex = (atlas: TextAtlas, char: string): number => atlas.index.get(char) ?? 0;

const CJK_FALLBACK = `"Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Meiryo", "Noto Sans CJK JP", "Droid Sans Fallback", sans-serif`;

/** A next/font face (its CSS variable, read from the document) ahead of the CJK system stack. */
const stackFor = (variable: string, family: string): string => {
  const loaded = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return `${loaded ? `${loaded}, ` : ""}"${family}", ${CJK_FALLBACK}`;
};

/** The site's condensed display face with CJK fallbacks: the beacon badge and the stall headers. Browser only. */
export const resolveSignFont = (): string => stackFor("--font-barlow-condensed", "Barlow Condensed");

/** The neon signs' and billboards' Latin face (Orbitron, loaded in `app/layout.tsx`) with CJK fallbacks. Browser only. */
export const resolveAtlasFont = (): string => stackFor("--font-orbitron", "Orbitron");

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
    ctx.font = `700 ${CHAR_CELL}px ${fontFamily}`;

    // "middle" anchors the em square's centre, and where a face's capitals (or an ideograph's body) sit in
    // that square varies, so measure a reference glyph per script and shift its class so the glyph's own
    // centre lands on the cell centre; positive = the glyph's centre is above the anchor, so draw lower
    const centreOffset = (reference: string): number => {
      const metrics = ctx.measureText(reference);
      return (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
    };
    const latinOffset = centreOffset("H");
    const cjkOffset = centreOffset("国");

    const draw = (char: string, cell: number, variant: number, style: { alpha: number; blur: number }) => {
      const col = cell % ATLAS_COLUMNS;
      const row = Math.floor(cell / ATLAS_COLUMNS);
      const logo = LOGO_GLYPHS.get(char);
      const offset = logo ? 0 : CJK.test(char) ? cjkOffset : latinOffset;
      const cx = col * ATLAS_CELL + pad + CHAR_CELL / 2;
      const cy = (variant * rows + row) * ATLAS_CELL + pad + CHAR_CELL / 2 + offset;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.shadowColor = "rgba(255, 255, 255, 1)";
      ctx.shadowBlur = style.blur;
      ctx.fillStyle = `rgba(255, 255, 255, ${style.alpha})`;

      if (logo) {
        // a logo is a path in its own coordinates: fit its visual bounds in a square centred on the cell
        const [x, y, width, height] = logo.bounds;
        const fit = LOGO_SIZE / Math.max(width, height);
        ctx.scale(fit, fit);
        ctx.translate(-(x + width / 2), -(y + height / 2));
        ctx.fill(new Path2D(logo.path));
      } else {
        ctx.font = `700 ${CHAR_CELL}px ${fontFamily}`;
        // squeeze wide characters into the cell
        const width = ctx.measureText(char).width;
        const squeeze = Math.min(1, (CHAR_CELL * 0.95) / Math.max(1, width));
        ctx.scale(squeeze, 1);
        ctx.fillText(char, 0, 0);
      }

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
