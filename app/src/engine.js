// The cover renderer: panels + grade, frame, title block, badge ribbon,
// heat meter, grain and vignette. Deterministic — the only randomness is
// the grain, seeded from grade + layout + size.
import { layoutPanels } from './layouts.js';
import { applyGrade } from './grades.js';
import { drawTitleBlock, drawBadgeRibbon } from './lettering.js';
import { drawPanelPhoto } from './photos.js';

/** mulberry32 — a tiny seeded PRNG, so grain is identical every render. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Fine monochrome grain over the whole cover, seeded and deterministic. */
export function drawGrain(ctx, W, H, seed) {
  const rand = seededRandom(seed);
  const dots = Math.floor((W * H) / 420);
  for (let i = 0; i < dots; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * H);
    const v = rand() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v}, ${v}, ${v}, ${0.03 + rand() * 0.06})`;
    ctx.fillRect(x, y, 1, 1);
  }
}

/** A soft dark vignette pulling the eye to the centre. */
export function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.72,
  );
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/**
 * Draws the whole cover for `state` onto `ctx` at W x H.
 * state = { layout, grade, title, subtitle, badge, photos, images }
 * where images maps photo src -> loaded HTMLImageElement.
 */
export function drawCover(state, ctx, W, H) {
  const { panels, band } = layoutPanels(state.layout, W, H);
  // White poster frame behind everything.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < panels.length; i++) {
    const rect = panels[i];
    const slot = state.photos[i];
    const img = slot ? state.images[slot.src] : null;
    if (!img) continue;
    // Grade on a temp canvas at panel size, then place (rotated if asked).
    const pw = Math.max(2, Math.round(rect.w));
    const ph = Math.max(2, Math.round(rect.h));
    const temp = document.createElement('canvas');
    temp.width = pw;
    temp.height = ph;
    const tctx = temp.getContext('2d');
    drawPanelPhoto(tctx, img, { x: 0, y: 0, w: pw, h: ph }, slot);
    applyGrade(temp, state.grade);
    ctx.save();
    if (rect.rotate) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rotate);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      ctx.beginPath();
      ctx.rect(0, 0, rect.w, rect.h);
      ctx.clip();
      ctx.drawImage(temp, 0, 0, rect.w, rect.h);
    } else {
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
      ctx.drawImage(temp, rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
  }
  drawTitleBlock(ctx, band, state.title, state.subtitle, W);
  drawBadgeRibbon(ctx, W, H, state.badge);
  drawGrain(ctx, W, H, hashString(`${state.grade}|${state.layout}|${W}x${H}`));
  drawVignette(ctx, W, H);
}
