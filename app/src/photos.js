// Photo state: the sample pool, per-panel crop/zoom/pan, and loading.
// A photo slot is { src, zoom, panX, panY } — pan is a -0.5..0.5 fraction
// of the panel, zoom 1..2.5. Images are cached by src so undo/redo and
// re-renders never reload a file.
export const SAMPLES = [
  { src: 'samples/convertible.jpg', label: 'Convertible' },
  { src: 'samples/rooftop.jpg', label: 'Rooftop' },
  { src: 'samples/neon-street.jpg', label: 'Neon street' },
  { src: 'samples/pier-man.jpg', label: 'Pier' },
  { src: 'samples/boulevard.jpg', label: 'Boulevard' },
  { src: 'samples/pier.jpg', label: 'Harbour' },
];

export const PANEL_COUNT = 9;

const imageCache = new Map();

/** Loads an image from a relative app path (or an object URL), cached. */
export function loadSamplePhoto(src) {
  if (imageCache.has(src)) return Promise.resolve(imageCache.get(src));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

/** Default photo slots: the six samples dealt round-robin over 9 panels. */
export function defaultPhotos() {
  return Array.from({ length: PANEL_COUNT }, (_, i) => ({
    src: SAMPLES[i % SAMPLES.length].src,
    zoom: 1,
    panX: 0,
    panY: 0,
  }));
}

/** Points panel `index` at a new photo, keeping its crop only if it fits. */
export function assignPhotoToPanel(photos, index, src) {
  const next = photos.map((p) => ({ ...p }));
  next[index] = { src, zoom: 1, panX: 0, panY: 0 };
  return next;
}

/** Resets one panel's crop back to a full cover-fill. */
export function resetPanelPhoto(photos, index) {
  const next = photos.map((p) => ({ ...p }));
  next[index] = { ...next[index], zoom: 1, panX: 0, panY: 0 };
  return next;
}

/**
 * Draws one photo cover-filling a rect: the image is scaled so it covers
 * the rect, then zoomed about its centre and panned by the slot's pan.
 */
export function drawPanelPhoto(ctx, img, rect, slot) {
  const { x, y, w, h } = rect;
  const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const scale = base * (slot?.zoom ?? 1);
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const panX = (slot?.panX ?? 0) * w;
  const panY = (slot?.panY ?? 0) * h;
  const dx = x + (w - pw) / 2 + panX;
  const dy = y + (h - ph) / 2 + panY;
  ctx.drawImage(img, dx, dy, pw, ph);
}
