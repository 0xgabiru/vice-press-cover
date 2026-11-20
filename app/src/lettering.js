// Lettering: the halftone title block, the display title, the script
// subtitle, the badge ribbon and the heat meter. All drawn on canvas.

/** Halftone dot field inside a rect: rows of dots, radius swelling by row. */
export function drawHalftone(ctx, x, y, w, h, color) {
  const spacing = Math.max(10, Math.round(Math.min(w, h) / 14));
  ctx.fillStyle = color;
  let row = 0;
  for (let cy = y + spacing / 2; cy < y + h; cy += spacing, row++) {
    for (let cx = x + spacing / 2 + (row % 2 ? spacing / 2 : 0); cx < x + w; cx += spacing) {
      const r = Math.max(0.6, (spacing * 0.22 * (0.5 + 0.5 * Math.sin(row * 0.9 + cx * 0.01))));
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Fits a title to 90% of a width, never below the 24 px floor. */
export function fitTitleFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 24) {
    size -= 2;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  return size;
}

/**
 * The title block: a dark band with a halftone strip, the Anton display
 * title in white with a black outline and drop shadow, and the Pacifico
 * script subtitle glowing in neon pink below it.
 */
export function drawTitleBlock(ctx, band, title, subtitle, coverW) {
  const { x, y, w, h } = band;
  ctx.fillStyle = 'rgba(10, 6, 20, 0.82)';
  ctx.fillRect(x, y, w, h);
  drawHalftone(ctx, x, y, w, Math.min(h * 0.28, 26), 'rgba(255, 255, 255, 0.35)');
  const text = (title || 'PALM CITY').trim().toUpperCase().slice(0, 28);
  const titleSize = fitTitleFont(ctx, text, w * 0.9, Math.min(h * 0.52, 120));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = titleSize * 0.18;
  ctx.shadowOffsetY = titleSize * 0.06;
  ctx.strokeStyle = '#0a0614';
  ctx.lineWidth = Math.max(3, titleSize * 0.1);
  ctx.strokeText(text, x + w / 2, y + h * 0.36);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x + w / 2, y + h * 0.36);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  const sub = (subtitle || '').trim().slice(0, 40);
  if (sub) {
    // The badge ribbon sits at the cover's bottom-right; keep the script
    // subtitle in the free zone left of it so the two never overlap.
    const ribbonLeft = coverW ? coverW * 0.6 : x + w;
    const availW = Math.max(100, Math.min(x + w, ribbonLeft) - x - 16);
    const centerX = x + availW / 2;
    let subSize = Math.max(16, Math.min(h * 0.22, 44));
    ctx.font = `${subSize}px Pacifico, cursive`;
    while (ctx.measureText(sub).width > availW * 0.98 && subSize > 14) {
      subSize -= 2;
      ctx.font = `${subSize}px Pacifico, cursive`;
    }
    ctx.shadowColor = 'rgba(255, 46, 166, 0.9)';
    ctx.shadowBlur = subSize * 0.45;
    ctx.fillStyle = '#ff7ad0';
    ctx.fillText(sub, centerX, y + h * 0.76);
    ctx.shadowBlur = 0;
  }
}

/** Three stars + HEAT label, drawn at (x, y) in the given size. */
export function drawHeatMeter(ctx, x, y, size, color = '#ffd23c') {
  ctx.fillStyle = color;
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('★★★', x, y);
  const starsW = ctx.measureText('★★★').width;
  ctx.font = `bold ${Math.round(size * 0.72)}px Anton, sans-serif`;
  ctx.fillText('HEAT', x + starsW + size * 0.35, y);
  return starsW + ctx.measureText('HEAT').width + size * 0.35;
}

/**
 * The badge ribbon: a tilted band at the cover's bottom-right corner with
 * the badge text, the heat meter and the EST. 2026 mark.
 */
export function drawBadgeRibbon(ctx, W, H, badgeText) {
  const label = (badgeText || 'EST. 2026').trim().toUpperCase().slice(0, 18) || 'EST. 2026';
  const ribbonH = Math.max(34, Math.round(H * 0.062));
  const ribbonW = Math.round(W * 0.38);
  const x = W - ribbonW - Math.round(W * 0.02);
  const y = H - ribbonH - Math.round(H * 0.02);
  ctx.save();
  ctx.translate(x + ribbonW / 2, y + ribbonH / 2);
  ctx.rotate(-0.06);
  ctx.fillStyle = '#ff2ea6';
  ctx.fillRect(-ribbonW / 2, -ribbonH / 2, ribbonW, ribbonH);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(-ribbonW / 2, ribbonH / 2 - 4, ribbonW, 4);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(ribbonH * 0.34)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, -ribbonH * 0.12);
  const meterSize = Math.round(ribbonH * 0.3);
  ctx.font = `${meterSize}px sans-serif`;
  const stars = '★★★ HEAT';
  ctx.fillText(stars, 0, ribbonH * 0.28);
  ctx.restore();
}
