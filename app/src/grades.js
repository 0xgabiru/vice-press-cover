// Colour grades: a gradient-map ramp turns each pixel's luminance into a
// colour from the ramp, then a translucent wash tints the whole panel.
// Every grade is a list of [stop 0..1, r, g, b] plus a wash colour + alpha.
export const GRADES = {
  sunset: {
    label: 'Sunset',
    ramp: [
      [0, 27, 16, 53],
      [0.35, 176, 48, 122],
      [0.65, 255, 122, 60],
      [0.85, 255, 197, 60],
      [1, 255, 243, 196],
    ],
    wash: [255, 90, 138, 0.12],
  },
  neon: {
    label: 'Neon',
    ramp: [
      [0, 13, 2, 33],
      [0.3, 91, 46, 229],
      [0.6, 255, 46, 166],
      [0.85, 34, 230, 210],
      [1, 232, 255, 249],
    ],
    wash: [255, 46, 166, 0.1],
  },
  viceTeal: {
    label: 'Vice teal',
    ramp: [
      [0, 4, 38, 43],
      [0.35, 14, 124, 134],
      [0.65, 47, 214, 200],
      [0.9, 255, 233, 176],
      [1, 255, 248, 224],
    ],
    wash: [47, 214, 200, 0.12],
  },
  hotPink: {
    label: 'Hot pink',
    ramp: [
      [0, 43, 10, 36],
      [0.4, 194, 24, 122],
      [0.7, 255, 79, 163],
      [0.9, 255, 214, 234],
      [1, 255, 255, 255],
    ],
    wash: [255, 79, 163, 0.12],
  },
  monoNoir: {
    label: 'Mono noir',
    ramp: [
      [0, 0, 0, 0],
      [0.5, 90, 90, 90],
      [0.85, 216, 216, 216],
      [1, 255, 246, 232],
    ],
    wash: [255, 255, 255, 0.06],
  },
};

export const GRADE_NAMES = Object.keys(GRADES);

/** Precomputed 256-entry lookup table for a grade ramp. */
export function gradeLookup(grade) {
  const ramp = GRADES[grade]?.ramp ?? GRADES.sunset.ramp;
  const table = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = ramp[0];
    let b = ramp[ramp.length - 1];
    for (let s = 0; s < ramp.length - 1; s++) {
      if (t >= ramp[s][0] && t <= ramp[s + 1][0]) {
        a = ramp[s];
        b = ramp[s + 1];
        break;
      }
    }
    const span = b[0] - a[0] || 1;
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    table[i * 3] = Math.round(a[1] + (b[1] - a[1]) * f);
    table[i * 3 + 1] = Math.round(a[2] + (b[2] - a[2]) * f);
    table[i * 3 + 2] = Math.round(a[3] + (b[3] - a[3]) * f);
  }
  return table;
}

/**
 * Applies a grade in place to a canvas: luminance -> ramp colour, then the
 * grade's translucent wash. Deterministic: no randomness anywhere here.
 */
export function applyGrade(canvas, grade) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  const table = gradeLookup(grade);
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
    const j = lum * 3;
    data[i] = table[j];
    data[i + 1] = table[j + 1];
    data[i + 2] = table[j + 2];
  }
  ctx.putImageData(image, 0, 0);
  const wash = GRADES[grade]?.wash ?? GRADES.sunset.wash;
  ctx.fillStyle = `rgba(${wash[0]}, ${wash[1]}, ${wash[2]}, ${wash[3]})`;
  ctx.fillRect(0, 0, w, h);
}
