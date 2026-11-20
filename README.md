# Vice Press — multi-panel neon cover studio (offline, PNG export)

Turn your photos into a striking multi-panel cover poster, right in the browser. Pick a layout, pick a colour grade, type your title, export a PNG. Your photos never leave your machine — everything runs offline, no uploads, no accounts.

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/0xgabiru/vice-press-cover/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/0xgabiru/vice-press-cover/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Built for the [cover art bounty](https://make.fun/bounty/gta6-cover-art-01) on [make.fun](https://make.fun/r/2mmnyhm3) — join with referral code `2mmnyhm3`: https://make.fun/r/2mmnyhm3

## Features

- **6 layouts**: full bleed, four panel, hero + three, nine panel, tilted snapshot, story split
- **5 colour grades**: sunset, neon, vice teal, hot pink, mono noir — gradient-mapped over your photos
- **Lettering**: Anton display title with halftone title block, Pacifico neon script subtitle, badge ribbon with heat meter
- **Your photos**: upload up to 4, or use the 6 built-in samples; click a panel to select it, drag inside it to pan, zoom per panel
- **Undo / redo**: full history (Ctrl+Z / Ctrl+Shift+Z)
- **Export PNG** in 4 sizes at once: 1080×1080, 1080×1350, 1920×1080, 1080×1920

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — no build step, no network needed. Node 22+ is enough.

## How it works

Vanilla ES modules + canvas 2D, no libraries. `app/src/engine.js` draws the cover (`drawCover`), `app/src/grades.js` maps each pixel's luminance through a colour ramp, `app/src/layouts.js` places the panels, `app/src/lettering.js` draws the title block, badge ribbon and heat meter, and `app/src/exporter.js` renders the same cover offscreen at export size and downloads the PNG.

Fonts are Anton and Pacifico (SIL Open Font License, texts in `app/fonts/`). Sample photos are AI-generated for this project, plus two starter samples free to use.

## License

MIT — see [LICENSE](LICENSE).
