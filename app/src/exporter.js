// PNG export: renders the cover offscreen at the exact requested size
// with the same drawCover the editor preview uses, then downloads it.
import { drawCover } from './engine.js';

export const EXPORT_SIZES = [
  { w: 1080, h: 1080, label: '1080 × 1080' },
  { w: 1080, h: 1350, label: '1080 × 1350' },
  { w: 1920, h: 1080, label: '1920 × 1080' },
  { w: 1080, h: 1920, label: '1080 × 1920' },
];

/** Renders the cover at W x H and resolves to a PNG blob. */
export async function exportCoverPNG(state, W, H) {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  drawCover(state, ctx, W, H);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/** Renders and downloads cover-<WxH>.png, resolving to the file name. */
export async function downloadCoverPNG(state, W, H) {
  const blob = await exportCoverPNG(state, W, H);
  const name = `cover-${W}x${H}.png`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return name;
}

/** Exports all four sizes in turn, calling onEach(name) after each one. */
export async function exportAllSizes(state, onEach) {
  const names = [];
  for (const size of EXPORT_SIZES) {
    const name = await downloadCoverPNG(state, size.w, size.h);
    names.push(name);
    if (onEach) onEach(name);
  }
  return names;
}
