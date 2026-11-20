// Layouts for the cover: each layout names its panels as fractions of the
// inner area (0..1, inside the white outer frame). A panel may be rotated.
// layoutPanels() turns those fractions into pixel rects plus the title band.
export const LAYOUTS = {
  fullBleed: {
    label: 'Full bleed',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
    band: { x: 0, y: 0.8, w: 1, h: 0.2, reserved: false },
  },
  fourPanel: {
    label: 'Four panel',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
    band: { x: 0, y: 0.8, w: 1, h: 0.2, reserved: false },
  },
  heroThree: {
    label: 'Hero + three',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 1 / 3 },
      { x: 0.62, y: 1 / 3, w: 0.38, h: 1 / 3 },
      { x: 0.62, y: 2 / 3, w: 0.38, h: 1 / 3 },
    ],
    band: { x: 0, y: 0.8, w: 1, h: 0.2, reserved: false },
  },
  ninePanel: {
    label: 'Nine panel',
    panels: [
      { x: 0, y: 0, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
      { x: 0, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 0, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
    ],
    band: { x: 0, y: 0.78, w: 1, h: 0.22, reserved: true },
  },
  tiltedSnapshot: {
    label: 'Tilted snapshot',
    panels: [
      { x: 0.05, y: 0.04, w: 0.6, h: 0.8, rotate: 0.05 },
      { x: 0.68, y: 0.06, w: 0.3, h: 0.36, rotate: -0.07 },
      { x: 0.66, y: 0.48, w: 0.3, h: 0.34, rotate: 0.06 },
    ],
    band: { x: 0, y: 0.82, w: 1, h: 0.18, reserved: false },
  },
  storySplit: {
    label: 'Story split',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
    band: { x: 0, y: 0.8, w: 1, h: 0.2, reserved: false },
  },
};

export const LAYOUT_NAMES = Object.keys(LAYOUTS);

/** Pixel rects for a layout at cover size W x H, plus the title band rect. */
export function layoutPanels(layout, W, H) {
  const def = LAYOUTS[layout] ?? LAYOUTS.heroThree;
  const frame = Math.max(12, Math.round(Math.min(W, H) * 0.015));
  const gutter = Math.max(6, Math.round(Math.min(W, H) * 0.008));
  const innerX = frame;
  const innerY = frame;
  const innerW = W - frame * 2;
  const innerH = H - frame * 2;
  // When the band is reserved, panels live in the area above it.
  const panelAreaH = def.band.reserved ? innerH * (1 - def.band.h) : innerH;
  const panels = def.panels.map((p) => {
    const x = innerX + p.x * innerW + gutter / 2;
    const y = innerY + p.y * panelAreaH + gutter / 2;
    const w = p.w * innerW - gutter;
    const h = p.h * panelAreaH - gutter;
    return { x, y, w, h, rotate: p.rotate ?? 0 };
  });
  const band = {
    x: innerX + def.band.x * innerW,
    y: innerY + def.band.y * innerH,
    w: def.band.w * innerW,
    h: def.band.h * innerH,
    reserved: def.band.reserved,
  };
  return { panels, band, frame, gutter };
}
