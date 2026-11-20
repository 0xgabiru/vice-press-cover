// Vice Press editor wiring: photo tray, layout + grade pickers, caption
// inputs, undo/redo, drag-to-pan, zoom, and PNG export. A `?shot=` query
// sets up a fixed scene for a screenshot instead (./shots.js).
import { LAYOUTS, LAYOUT_NAMES, layoutPanels } from './layouts.js';
import { GRADES, GRADE_NAMES } from './grades.js';
import { SAMPLES, defaultPhotos, loadSamplePhoto, assignPhotoToPanel, resetPanelPhoto } from './photos.js';
import { drawCover } from './engine.js';
import { EXPORT_SIZES, downloadCoverPNG, exportAllSizes } from './exporter.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const query = new URLSearchParams(location.search);

/** The editor state: everything undo/redo snapshots, plus loaded images. */
export const EditorState = {
  layout: 'heroThree',
  grade: 'sunset',
  title: 'PALM CITY',
  subtitle: 'golden hour in palm city',
  badge: 'EST. 2026',
  photos: defaultPhotos(),
  images: {},
  size: { w: 1920, h: 1080 },
  selected: 0,
};

const state = EditorState;

// ---- history: undo/redo over JSON snapshots (images stay cached) ----
const history = [];
let historyIndex = -1;

function snapshot() {
  return JSON.stringify({
    layout: state.layout,
    grade: state.grade,
    title: state.title,
    subtitle: state.subtitle,
    badge: state.badge,
    photos: state.photos,
    size: state.size,
    selected: state.selected,
  });
}

function pushHistory() {
  history.length = historyIndex + 1;
  history.push(snapshot());
  if (history.length > 50) history.shift();
  historyIndex = history.length - 1;
  updateUndoButtons();
}

function restore(text) {
  const s = JSON.parse(text);
  Object.assign(state, s);
  syncControls();
  redraw();
}

export function undo() {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  restore(history[historyIndex]);
  updateUndoButtons();
}

export function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex += 1;
  restore(history[historyIndex]);
  updateUndoButtons();
}

function updateUndoButtons() {
  document.getElementById('undo').disabled = historyIndex <= 0;
  document.getElementById('redo').disabled = historyIndex >= history.length - 1;
}

// ---- rendering ----
function previewSize() {
  const max = 900;
  const { w, h } = state.size;
  const scale = Math.min(1, max / Math.max(w, h));
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

export function redraw() {
  const { w, h } = previewSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  drawCover(state, ctx, w, h);
  highlightSelectedPanel();
}

function highlightSelectedPanel() {
  const overlay = document.getElementById('panel-hint');
  const { panels } = layoutPanels(state.layout, canvas.width, canvas.height);
  const rect = panels[state.selected];
  if (!overlay || !rect) return;
  overlay.style.left = `${(rect.x / canvas.width) * 100}%`;
  overlay.style.top = `${(rect.y / canvas.height) * 100}%`;
  overlay.style.width = `${(rect.w / canvas.width) * 100}%`;
  overlay.style.height = `${(rect.h / canvas.height) * 100}%`;
  overlay.textContent = `Panel ${state.selected + 1} — drag to pan`;
}

// ---- controls ----
function syncControls() {
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('badge').value = state.badge;
  document.querySelectorAll('#layouts button').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#grades button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#sizes button').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.w) === state.size.w && Number(b.dataset.h) === state.size.h);
  });
  const slot = state.photos[state.selected];
  const zoom = document.getElementById('zoom');
  zoom.value = slot ? slot.zoom : 1;
  document.getElementById('zoom-value').textContent = `${(slot ? slot.zoom : 1).toFixed(2)}×`;
}

function buildTray() {
  const tray = document.getElementById('tray');
  for (const sample of SAMPLES) {
    const img = document.createElement('img');
    img.src = sample.src;
    img.alt = sample.label;
    img.title = `Use ${sample.label}`;
    img.addEventListener('click', async () => {
      state.photos = assignPhotoToPanel(state.photos, state.selected, sample.src);
      await loadSamplePhoto(sample.src);
      state.images[sample.src] = await loadSamplePhoto(sample.src);
      pushHistory();
      redraw();
    });
    tray.appendChild(img);
  }
}

function buildLayoutPicker() {
  const wrap = document.getElementById('layouts');
  for (const name of LAYOUT_NAMES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.layout = name;
    button.title = LAYOUTS[name].label;
    const mini = document.createElement('canvas');
    mini.width = 96;
    mini.height = 60;
    const mctx = mini.getContext('2d');
    mctx.fillStyle = '#2b1838';
    mctx.fillRect(0, 0, 96, 60);
    const { panels, band } = layoutPanels(name, 96, 60);
    const palette = ['#ff7a3c', '#ff2ea6', '#2fd6c8', '#ffd23c', '#7a5cff', '#ff4f7a', '#3ce06e', '#4fa3ff', '#ff9a3c'];
    panels.forEach((p, i) => {
      mctx.fillStyle = palette[i % palette.length];
      mctx.fillRect(p.x, p.y, p.w, p.h);
    });
    mctx.fillStyle = 'rgba(10, 6, 20, 0.9)';
    mctx.fillRect(band.x, band.y, band.w, band.h);
    button.appendChild(mini);
    const label = document.createElement('span');
    label.textContent = LAYOUTS[name].label;
    button.appendChild(label);
    button.addEventListener('click', () => {
      state.layout = name;
      if (state.selected >= panels.length) state.selected = 0;
      pushHistory();
      redraw();
      syncControls();
    });
    wrap.appendChild(button);
  }
}

function buildGradePicker() {
  const wrap = document.getElementById('grades');
  for (const name of GRADE_NAMES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.grade = name;
    const ramp = GRADES[name].ramp;
    const stops = ramp.map(([t, r, g, b]) => `rgb(${r}, ${g}, ${b}) ${Math.round(t * 100)}%`).join(', ');
    button.style.background = `linear-gradient(90deg, ${stops})`;
    button.title = GRADES[name].label;
    const label = document.createElement('span');
    label.textContent = GRADES[name].label;
    button.appendChild(label);
    button.addEventListener('click', () => {
      state.grade = name;
      pushHistory();
      redraw();
      syncControls();
    });
    wrap.appendChild(button);
  }
}

function buildSizeButtons() {
  const wrap = document.getElementById('sizes');
  for (const size of EXPORT_SIZES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.w = size.w;
    button.dataset.h = size.h;
    button.textContent = size.label;
    button.addEventListener('click', async () => {
      state.size = { w: size.w, h: size.h };
      pushHistory();
      syncControls();
      redraw();
      const name = await downloadCoverPNG(state, size.w, size.h);
      status.textContent = `Saved ${name}`;
    });
    wrap.appendChild(button);
  }
}

// ---- photo upload (up to 4 of the user's own photos) ----
async function addUpload(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const url = URL.createObjectURL(file);
  const img = await loadSamplePhoto(url);
  state.images[url] = img;
  state.photos = assignPhotoToPanel(state.photos, state.selected, url);
  const tray = document.getElementById('tray');
  const thumb = document.createElement('img');
  thumb.src = url;
  thumb.alt = file.name;
  thumb.title = file.name;
  thumb.addEventListener('click', () => {
    state.photos = assignPhotoToPanel(state.photos, state.selected, url);
    pushHistory();
    redraw();
  });
  tray.appendChild(thumb);
  pushHistory();
  redraw();
}

// ---- panel picking + drag to pan ----
function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function panelAt(point) {
  const { panels } = layoutPanels(state.layout, canvas.width, canvas.height);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (point.x >= p.x && point.x <= p.x + p.w && point.y >= p.y && point.y <= p.y + p.h) return i;
  }
  return 0;
}

let dragging = null;
canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  state.selected = panelAt(point);
  syncControls();
  redraw();
  dragging = { x: point.x, y: point.y, panX: state.photos[state.selected].panX, panY: state.photos[state.selected].panY };
  try {
    canvas.setPointerCapture(event.pointerId);
  } catch {
    // Synthetic or already-released pointers have nothing to capture;
    // dragging still tracks pointermove on the canvas.
  }
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const point = canvasPoint(event);
  const { panels } = layoutPanels(state.layout, canvas.width, canvas.height);
  const rect = panels[state.selected];
  const slot = state.photos[state.selected];
  const limit = Math.max(0.05, (slot.zoom - 1) / 2 + 0.05);
  slot.panX = Math.max(-limit, Math.min(limit, dragging.panX + (point.x - dragging.x) / rect.w));
  slot.panY = Math.max(-limit, Math.min(limit, dragging.panY + (point.y - dragging.y) / rect.h));
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (dragging) pushHistory();
  dragging = null;
});
canvas.addEventListener('dragover', (event) => event.preventDefault());
canvas.addEventListener('drop', async (event) => {
  event.preventDefault();
  for (const file of event.dataTransfer.files) await addUpload(file);
});

// ---- shot scenes ----
async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('100px Pacifico'),
      document.fonts.ready,
    ]);
  } catch {
    // Fallback fonts still render; the cover must never fail on fonts.
  }
}

function applyQuery(q) {
  if (q.get('layout') && LAYOUTS[q.get('layout')]) state.layout = q.get('layout');
  if (q.get('grade') && GRADES[q.get('grade')]) state.grade = q.get('grade');
  if (q.get('title')) state.title = q.get('title');
  if (q.get('subtitle') !== null) state.subtitle = q.get('subtitle') ?? state.subtitle;
  if (q.get('badge')) state.badge = q.get('badge');
  const size = q.get('size');
  if (size) {
    const [w, h] = size.split('x').map(Number);
    if (w > 0 && h > 0) state.size = { w, h };
  }
}

async function renderCoverScene() {
  await loadFonts();
  const { w, h } = state.size;
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(state, off.getContext('2d'), w, h);
  // Show the exported cover itself, filling the viewport.
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0614';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const scale = Math.min(canvas.width / w, canvas.height / h);
  const dw = w * scale;
  const dh = h * scale;
  ctx.drawImage(off, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
}

async function renderEditor() {
  await loadFonts();
  syncControls();
  redraw();
}

// ---- static wiring ----
buildTray();
buildLayoutPicker();
buildGradePicker();
buildSizeButtons();
syncControls();

document.getElementById('upload').addEventListener('change', async (event) => {
  for (const file of event.target.files) await addUpload(file);
  event.target.value = '';
});
document.getElementById('title').addEventListener('input', (event) => {
  state.title = event.target.value;
  redraw();
});
document.getElementById('title').addEventListener('change', pushHistory);
document.getElementById('subtitle').addEventListener('input', (event) => {
  state.subtitle = event.target.value;
  redraw();
});
document.getElementById('subtitle').addEventListener('change', pushHistory);
document.getElementById('badge').addEventListener('input', (event) => {
  state.badge = event.target.value;
  redraw();
});
document.getElementById('badge').addEventListener('change', pushHistory);
document.getElementById('zoom').addEventListener('input', (event) => {
  state.photos[state.selected].zoom = Number(event.target.value);
  document.getElementById('zoom-value').textContent = `${Number(event.target.value).toFixed(2)}×`;
  redraw();
});
document.getElementById('zoom').addEventListener('change', pushHistory);
document.getElementById('reset-panel').addEventListener('click', () => {
  state.photos = resetPanelPhoto(state.photos, state.selected);
  pushHistory();
  syncControls();
  redraw();
});
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
    event.preventDefault();
    undo();
  } else if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))) {
    event.preventDefault();
    redo();
  }
});
document.getElementById('export-all').addEventListener('click', async () => {
  status.textContent = 'Exporting all 4 sizes…';
  await exportAllSizes(state, (name) => { status.textContent = `Saved ${name}`; });
  status.textContent = 'Saved all 4 sizes.';
});

// ---- boot: load every sample, then draw ----
const shot = query.get('shot');
(async () => {
  for (const sample of SAMPLES) {
    try {
      state.images[sample.src] = await loadSamplePhoto(sample.src);
    } catch {
      // A missing sample leaves its panels blank; the rest still render.
    }
  }
  await loadFonts();
  if (shot) {
    await runShot(shot, query, { loadFonts, applyQuery, renderCoverScene, renderEditor });
  } else {
    pushHistory();
    redraw();
  }
})();
