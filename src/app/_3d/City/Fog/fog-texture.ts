import { CanvasTexture, RepeatWrapping } from "three";
import { mulberry32 } from "../../utils";

export const FOG_TILE_WIDTH = 1024;
export const FOG_TILE_HEIGHT = 200;

/**
 * The reference's fog tile: 80 soft purple blobs on a 1024x200 canvas, wrapped horizontally and masked so
 * it fades out toward the top. Deterministic for a seed; touches the DOM, so create it outside render.
 */
export const createFogTexture = (seed = 77): CanvasTexture => {
  const canvas = document.createElement("canvas");
  canvas.width = FOG_TILE_WIDTH;
  canvas.height = FOG_TILE_HEIGHT;

  const ctx = canvas.getContext("2d");

  if (ctx) {
    const rand = mulberry32(seed);

    for (let i = 0; i < 80; i++) {
      const x = FOG_TILE_WIDTH * rand();
      const y = 70 + 130 * rand();
      const radius = 40 + 120 * rand();
      const alpha = 0.05 + 0.12 * rand();

      for (const wrap of [-FOG_TILE_WIDTH, 0, FOG_TILE_WIDTH]) {
        const gradient = ctx.createRadialGradient(x + wrap, y, 0, x + wrap, y, radius);
        gradient.addColorStop(0, `rgba(176, 80, 196, ${alpha})`);
        gradient.addColorStop(1, "rgba(176, 80, 196, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(x + wrap - radius, y - radius, 2 * radius, 2 * radius);
      }
    }

    ctx.globalCompositeOperation = "destination-in";
    const mask = ctx.createLinearGradient(0, 0, 0, FOG_TILE_HEIGHT);
    mask.addColorStop(0, "rgba(0,0,0,0)");
    mask.addColorStop(0.5, "rgba(0,0,0,0.8)");
    mask.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, FOG_TILE_WIDTH, FOG_TILE_HEIGHT);
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  // the canvas y axis points down; three samples with v = 0 at the bottom, so flip to keep the fade at the top
  texture.flipY = true;

  return texture;
};
