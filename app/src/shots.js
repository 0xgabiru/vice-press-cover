// Fixed scenes for screenshots: ?shot=cover shows the exported cover
// alone, filling the viewport; ?shot=editor shows the editor with photos
// loaded. window.__shotReady is set once painted, after two frames.
export async function runShot(shot, query, api) {
  await api.loadFonts();
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    api.applyQuery(query);
    await api.renderCoverScene();
  } else {
    document.body.classList.add('shot-editor');
    api.applyQuery(query);
    await api.renderEditor();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
