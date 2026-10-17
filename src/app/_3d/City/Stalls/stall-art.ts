import { CanvasTexture, LinearFilter } from "three";
import { resolveSignFont } from "../text-atlas";
import type { Placement } from "./stall-geometry";
import type { Rgb, StallPlan } from "./stall-plan";
import { AMBER, LAVENDER } from "./stall-plan";

/** Texture pixels per reference pixel. */
export const STALL_RESOLUTION = 2;

/** One painted sprite in the sheet; size in reference px, uv in [0, 1]. */
export type SheetCell = {
  height: number;
  uv: readonly [number, number, number, number];
  width: number;
};

export type StallSheet = {
  /** Per plan: the curtain panels hanging from the roof line. */
  curtains: SheetCell[];
  glow: { amber: SheetCell; lavender: SheetCell };
  lantern: SheetCell;
  /** Per plan: patrons on stools, drawn against the counter. */
  patrons: SheetCell[];
  /** Per placement: the word on the header, for stalls whose variant has a solid roof. */
  signs: (null | SheetCell)[];
  texture: CanvasTexture;
};

export const GLOW_CELL = 64;

/** The solid roof's neon word: a header standing on the roof's front edge, sized so a short word reads, reference px. */
export const signBoard = (plan: StallPlan) => ({ height: 1.6 * plan.awning.rise, width: 0.7 * plan.width });
/** Margin around the word's cell so its glow isn't clipped, reference px. */
export const SIGN_GLOW_PAD = 6;
export const LANTERN_CELL = 24;
export const PATRONS_CELL_HEIGHT = 28;

const rgba = (c: Rgb, a = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;

type Painter = (ctx: CanvasRenderingContext2D) => void;

/** Painters draw in cell-local coordinates: origin at the cell's bottom-left, y up. */
const paintCurtain =
  (plan: StallPlan, width: number, height: number): Painter =>
  (ctx) => {
    const { color, panels } = plan.curtain;
    const panelW = width / panels;
    for (let p = 0; p < panels; p++) {
      const px = p * panelW;
      ctx.fillStyle = rgba(color, 0.96);
      ctx.fillRect(px + 0.6, 0, panelW - 1.2, height);
      // light slit and a tie
      ctx.fillStyle = "rgba(240, 232, 220, 0.5)";
      ctx.fillRect(px + panelW / 2 - 0.6, 0.3 * height, 1.2, 0.4 * height);
      if (p % 2 === 0) {
        ctx.fillRect(px + panelW / 2 - 2, 0.55 * height, 4, 1);
      }
    }
  };

const paintPatrons =
  (plan: StallPlan): Painter =>
  (ctx) => {
    ctx.fillStyle = "rgb(8, 3, 16)";
    for (const px of plan.patrons) {
      const py = 8;
      // stool seat and leg, torso, head
      ctx.fillRect(px - 3, py - 1.5, 6, 1.5);
      ctx.fillRect(px - 0.5, 0, 1, py);
      ctx.beginPath();
      ctx.moveTo(px - 4.5, py);
      ctx.lineTo(px - 4, py + 11);
      ctx.quadraticCurveTo(px, py + 14, px + 4, py + 11);
      ctx.lineTo(px + 4.5, py);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py + 16.5, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

/**
 * The signboard word as free-standing neon: a soft halo in the sign colour, then a bright core, centred in a
 * cell padded by `SIGN_GLOW_PAD`; painters are y-up, so the text is flipped back.
 */
const paintSign =
  (text: string, width: number, height: number, font: string, color: Rgb): Painter =>
  (ctx) => {
    const inner = { height: height - 2 * SIGN_GLOW_PAD, width: width - 2 * SIGN_GLOW_PAD };
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(1, -1);
    const size = 0.8 * inner.height;
    ctx.font = `700 ${size}px ${font}`;
    const measured = ctx.measureText(text).width;
    const fit = Math.min(1, (0.95 * inner.width) / Math.max(1, measured));
    ctx.font = `700 ${size * fit}px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const y = 0.04 * inner.height;

    // halo: the tube's colour bled outward, drawn twice so the glow reads at the sheet's resolution
    ctx.shadowColor = rgba(color, 1);
    ctx.shadowBlur = 0.6 * inner.height;
    ctx.fillStyle = rgba(color, 0.85);
    ctx.fillText(text, 0, y);
    ctx.shadowBlur = 0.2 * inner.height;
    ctx.fillText(text, 0, y);
    // core: nearly white, tinted
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(
      [
        Math.round(255 - (255 - color[0]) * 0.25),
        Math.round(255 - (255 - color[1]) * 0.25),
        Math.round(255 - (255 - color[2]) * 0.25),
      ],
      1,
    );
    ctx.fillText(text, 0, y);
    ctx.restore();
  };

const paintLantern: Painter = (ctx) => {
  const lx = LANTERN_CELL / 2;
  const ly = LANTERN_CELL - 11;
  ctx.fillStyle = "rgba(20, 8, 12, 0.9)";
  ctx.fillRect(lx - 0.4, LANTERN_CELL - 6, 0.8, 6);
  const halo = ctx.createRadialGradient(lx, ly, 0, lx, ly, 11);
  // most of the lantern's glow is a volumetric sphere in the scene; the painted halo is just a soft rim
  halo.addColorStop(0, "rgba(255, 110, 70, 0.12)");
  halo.addColorStop(1, "rgba(255, 110, 70, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(lx - 11, ly - 11, 22, 22);
  const paper = ctx.createRadialGradient(lx - 1, ly + 1, 0.5, lx, ly, 5);
  paper.addColorStop(0, "rgb(255, 214, 150)");
  paper.addColorStop(0.6, "rgb(232, 80, 52)");
  paper.addColorStop(1, "rgb(140, 24, 34)");
  ctx.fillStyle = paper;
  ctx.beginPath();
  ctx.ellipse(lx, ly, 3.6, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(30, 8, 12, 0.95)";
  ctx.fillRect(lx - 1.8, ly + 4.4, 3.6, 1.2);
  ctx.fillRect(lx - 1.8, ly - 5.6, 3.6, 1.2);
};

const paintGlow =
  (color: Rgb): Painter =>
  (ctx) => {
    const c = GLOW_CELL / 2;
    const glow = ctx.createRadialGradient(c, c, 0, c, c, c);
    glow.addColorStop(0, rgba(color, 0.24));
    glow.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, GLOW_CELL, GLOW_CELL);
  };

/**
 * Paints the stalls' sprite details into one sheet: per-plan curtains and patrons, per-placement header words,
 * plus a lantern and the two warm glows. The structure itself is geometry (see `stall-geometry.ts`). Touches the DOM, so build it
 * in a state initializer.
 */
export const createStallSheet = (plans: StallPlan[], placements: Placement[]): StallSheet => {
  const jobs: { height: number; paint: Painter; width: number }[] = [];
  const add = (width: number, height: number, paint: Painter): number => jobs.push({ height, paint, width }) - 1;

  const curtainIds = plans.map((plan) => {
    const width = plan.width - 8;
    return add(width, plan.curtain.height, paintCurtain(plan, width, plan.curtain.height));
  });
  const patronIds = plans.map((plan) => add(plan.width, PATRONS_CELL_HEIGHT, paintPatrons(plan)));
  const font = resolveSignFont();
  const signIds = placements.map(({ plan, word }) => {
    if (plan.awning.kind !== "solid" || !word) {
      return -1;
    }
    const { height, width } = signBoard(plan);
    const cellW = width + 2 * SIGN_GLOW_PAD;
    const cellH = height + 2 * SIGN_GLOW_PAD;
    return add(cellW, cellH, paintSign(word, cellW, cellH, font, plan.awning.sign));
  });
  const lanternId = add(LANTERN_CELL, LANTERN_CELL, paintLantern);
  const amberId = add(GLOW_CELL, GLOW_CELL, paintGlow(AMBER));
  const lavenderId = add(GLOW_CELL, GLOW_CELL, paintGlow(LAVENDER));

  // one row, cells of varying size; a 1px gutter keeps linear filtering from bleeding between cells
  const gutter = 1;
  const sheetWidth = jobs.reduce((sum, job) => sum + job.width + gutter, 0);
  const sheetHeight = Math.max(...jobs.map((job) => job.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(sheetWidth * STALL_RESOLUTION);
  canvas.height = Math.ceil(sheetHeight * STALL_RESOLUTION);
  const ctx = canvas.getContext("2d");

  const cells: SheetCell[] = [];
  let cursor = 0;

  for (const job of jobs) {
    if (ctx) {
      ctx.save();
      ctx.scale(STALL_RESOLUTION, STALL_RESOLUTION);
      ctx.beginPath();
      ctx.rect(cursor, sheetHeight - job.height, job.width, job.height);
      ctx.clip();
      // cell-local, y up
      ctx.translate(cursor, sheetHeight);
      ctx.scale(1, -1);
      job.paint(ctx);
      ctx.restore();
    }

    // canvas rows run top-down; the quad's v runs bottom-up, so v0 is the cell's bottom
    cells.push({
      height: job.height,
      uv: [cursor / sheetWidth, 0, (cursor + job.width) / sheetWidth, job.height / sheetHeight],
      width: job.width,
    });
    cursor += job.width + gutter;
  }

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  // the painter's y-up cells sit at the bottom of the canvas; flipY (the default) puts v = 0 there
  texture.flipY = true;

  const cell = (id: number): SheetCell => cells[id] ?? { height: 1, uv: [0, 0, 0, 0], width: 1 };

  return {
    curtains: curtainIds.map(cell),
    glow: { amber: cell(amberId), lavender: cell(lavenderId) },
    lantern: cell(lanternId),
    patrons: patronIds.map(cell),
    signs: signIds.map((id) => (id < 0 ? null : cell(id))),
    texture,
  };
};
