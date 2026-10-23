// Hand-built SVG botanicals: palms, fronds, hedges and mowed-lawn stripes.
// Used twice: inline in the home hero (each depth is its own layer so it can drift
// on scroll) and by scripts/generate-placeholders.mjs to draw the service
// illustrations until Alex's real photos replace them.
// Plain strings, no DOM, so it runs in Astro at build time and in Node.

export const PALETTE = {
  skyTop: '#CFE5DD',
  skyLow: '#F4E2CD',
  sun: '#FBEEDC',
  haze: '#B2CDBF',
  hazePalm: '#9DBEAD',
  mid: '#3D7A5A',
  midDeep: '#2B6047',
  hedge: '#28573F',
  lawnLight: '#7DB46A',
  lawnDark: '#5F9A55',
  canopy: '#16392A',
  canopyLift: '#1F4B37',
  mulch: '#5A3B26',
  mulchLight: '#74503A',
  bloom: '#C2416F',
  paver: '#D9D3C4',
  paverDirty: '#9C9A86',
};

const r = (n) => Math.round(n * 10) / 10;

/** A single leaf blade from (x0,y0) to (x1,y1), widest in the middle. */
export function leaf(x0, y0, x1, y1, width, bend = 0) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const mx = (x0 + x1) / 2 + nx * bend;
  const my = (y0 + y1) / 2 + ny * bend;
  return `M${r(x0)} ${r(y0)}Q${r(mx + nx * width)} ${r(my + ny * width)} ${r(x1)} ${r(y1)}Q${r(mx - nx * width)} ${r(my - ny * width)} ${r(x0)} ${r(y0)}Z`;
}

/**
 * A pinnate (coconut-style) frond: a curved midrib with leaflets down both sides.
 * angle is in degrees, SVG convention (0 = right, -90 = up). Returns path data.
 */
export function frond(bx, by, angle, length, droop, { leaflets = 26, leafLen = length * 0.3, leafWidth = 6, spread = 52 } = {}) {
  const a = (angle * Math.PI) / 180;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const cx = bx + ux * length * 0.55;
  const cy = by + uy * length * 0.55;
  const tx = bx + ux * length;
  const ty = by + uy * length + droop;
  const point = (t) => [
    (1 - t) ** 2 * bx + 2 * (1 - t) * t * cx + t ** 2 * tx,
    (1 - t) ** 2 * by + 2 * (1 - t) * t * cy + t ** 2 * ty,
  ];
  const tangent = (t) => {
    const x = 2 * (1 - t) * (cx - bx) + 2 * t * (tx - cx);
    const y = 2 * (1 - t) * (cy - by) + 2 * t * (ty - cy);
    const l = Math.hypot(x, y) || 1;
    return [x / l, y / l];
  };
  const parts = [];
  // Midrib, as a slim leaf so the whole frond is one filled path.
  parts.push(leaf(bx, by, tx, ty, leafWidth * 0.45, droop * 0.18));
  const s = (spread * Math.PI) / 180;
  for (let i = 0; i < leaflets; i += 1) {
    const t = 0.1 + (0.88 * i) / (leaflets - 1);
    const [px, py] = point(t);
    const [dx, dy] = tangent(t);
    const len = leafLen * (1 - 0.72 * t) * (0.75 + 0.25 * Math.sin(i * 2.3));
    for (const side of [-1, 1]) {
      const cos = Math.cos(s * side);
      const sin = Math.sin(s * side);
      let lx = dx * cos - dy * sin;
      let ly = dx * sin + dy * cos + 0.45; // leaflets hang under their own weight
      const l = Math.hypot(lx, ly) || 1;
      lx /= l;
      ly /= l;
      parts.push(leaf(px, py, px + lx * len, py + ly * len, leafWidth * (1 - 0.5 * t), side * len * 0.12));
    }
  }
  return parts.join('');
}

/** A palm: tapered, gently curved trunk and a crown of fronds. Returns path data. */
export function palm(x, groundY, height, lean = 0, { fronds = 9, crown = 0.42, trunk = 0.03 } = {}) {
  const topX = x + lean;
  const topY = groundY - height;
  const w = height * trunk;
  const ctrlX = x + lean * 0.15;
  const ctrlY = groundY - height * 0.55;
  const body = `M${r(x - w)} ${r(groundY)}Q${r(ctrlX - w * 0.8)} ${r(ctrlY)} ${r(topX - w * 0.55)} ${r(topY)}L${r(topX + w * 0.55)} ${r(topY)}Q${r(ctrlX + w * 0.8)} ${r(ctrlY)} ${r(x + w)} ${r(groundY)}Z`;
  const parts = [body];
  const len = height * crown;
  for (let i = 0; i < fronds; i += 1) {
    const t = i / (fronds - 1);
    const angle = -172 + 164 * t + Math.sin(i * 1.7) * 6;
    const side = Math.abs(Math.cos((angle * Math.PI) / 180));
    parts.push(
      frond(topX, topY, angle, len * (0.85 + 0.2 * Math.sin(i * 2.1)), len * (0.25 + 0.55 * side), {
        leaflets: 13,
        leafLen: len * 0.36,
        leafWidth: Math.max(3, len * 0.042),
        spread: 48,
      }),
    );
  }
  return parts.join('');
}

/** A clipped hedge: a long block with a softly scalloped top. */
export function hedge(x, y, w, h, bump = h * 0.22) {
  const n = Math.max(2, Math.round(w / (bump * 2.4)));
  const step = w / n;
  let d = `M${r(x)} ${r(y + h)}L${r(x)} ${r(y + bump)}`;
  for (let i = 0; i < n; i += 1) {
    const x0 = x + i * step;
    d += `Q${r(x0 + step / 2)} ${r(y - bump * 0.6 * (0.7 + 0.3 * Math.sin(i * 1.9)))} ${r(x0 + step)} ${r(y + bump)}`;
  }
  return `${d}L${r(x + w)} ${r(y + h)}Z`;
}

/** A rounded shrub made of overlapping lobes. */
export function shrub(cx, baseY, size) {
  const lobes = [
    [-0.42, -0.38, 0.42],
    [0.38, -0.36, 0.44],
    [0, -0.62, 0.5],
    [-0.1, -0.3, 0.46],
  ];
  return lobes
    .map(([ox, oy, rr]) => {
      const rad = size * rr;
      const x0 = cx + ox * size;
      const y0 = baseY + oy * size;
      return `M${r(x0 - rad)} ${r(y0)}a${r(rad)} ${r(rad)} 0 1 0 ${r(rad * 2)} 0a${r(rad)} ${r(rad)} 0 1 0 ${r(-rad * 2)} 0Z`;
    })
    .join('');
}

/**
 * Mowed-lawn stripes in perspective: alternating bands that converge toward a
 * vanishing point above the horizon. Returns two path strings (light, dark).
 */
export function lawnStripes(width, height, horizonY, vx, vy, band) {
  const light = [];
  const dark = [];
  const atHorizon = (bx) => vx + ((bx - vx) * (horizonY - vy)) / (height - vy);
  const start = vx - Math.ceil((vx + width) / band) * band;
  let i = 0;
  for (let bx = start; bx < width * 2 + band; bx += band, i += 1) {
    const b0 = bx;
    const b1 = bx + band;
    const d = `M${r(b0)} ${r(height)}L${r(atHorizon(b0))} ${r(horizonY)}L${r(atHorizon(b1))} ${r(horizonY)}L${r(b1)} ${r(height)}Z`;
    (i % 2 === 0 ? light : dark).push(d);
  }
  return [light.join(''), dark.join('')];
}

const svgOpen = (w, h, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" ${extra}>`;

/* ------------------------------------------------------------------ */
/* Home hero: five depth layers, each a complete SVG with one viewBox. */
/* ------------------------------------------------------------------ */

export const HERO = { width: 1600, height: 1000, horizon: 760 };

export function heroLayers() {
  const { width: W, height: H, horizon: Y } = HERO;
  const P = PALETTE;
  const aspect = 'preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false"';

  const sky = `${svgOpen(W, H, aspect)}
    <defs>
      <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${P.skyTop}"/><stop offset="0.72" stop-color="${P.skyLow}"/>
      </linearGradient>
      <radialGradient id="hero-sun" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="${P.sun}"/><stop offset="1" stop-color="${P.sun}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#hero-sky)"/>
    <circle cx="1190" cy="560" r="300" fill="url(#hero-sun)"/>
  </svg>`;

  const farPalms = [
    palm(905, Y - 18, 200, 8),
    palm(965, Y - 14, 240, -10),
    palm(1460, Y - 20, 250, 14),
    palm(1545, Y - 16, 205, -6),
  ].join('');
  let farTrees = '';
  for (let x = -40; x < W + 80; x += 70) {
    farTrees += shrub(x, Y + 4, 70 + 26 * Math.sin(x * 0.013) + 14 * Math.sin(x * 0.041));
  }
  const far = `${svgOpen(W, H, aspect)}
    <path d="${farTrees}" fill="${P.haze}"/>
    <path d="${farPalms}" fill="${P.hazePalm}"/>
  </svg>`;

  const midPalms = [
    palm(1075, Y + 6, 470, -26, { fronds: 10 }),
    palm(1235, Y + 8, 590, 18, { fronds: 11 }),
    palm(1395, Y + 6, 430, 34, { fronds: 10 }),
  ].join('');
  const mid = `${svgOpen(W, H, aspect)}
    <path d="${midPalms}" fill="${P.mid}"/>
    <path d="${hedge(-20, Y - 40, W + 40, 64, 16)}" fill="${P.hedge}"/>
    <path d="${shrub(980, Y + 2, 86)}${shrub(1500, Y + 4, 96)}${shrub(560, Y + 2, 70)}" fill="${P.midDeep}"/>
  </svg>`;

  const [light, dark] = lawnStripes(W, H, Y + 20, 1080, 300, 210);
  // The sun sits low behind the palms, so each trunk throws a long, soft shadow
  // toward the viewer.
  const shadows = [[1075, -26], [1235, 18], [1395, 34]].map(([x, lean]) => {
    const y0 = Y + 26;
    const dx = -180 - lean * 2;
    return `M${x - 7} ${y0}L${x + dx - 18} ${H}L${x + dx + 22} ${H}L${x + 7} ${y0}Z`;
  }).join('');
  const lawn = `${svgOpen(W, H, aspect)}
    <defs>
      <filter id="hero-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
      <linearGradient id="hero-lawn-shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${P.canopy}" stop-opacity="0.28"/>
        <stop offset="0.35" stop-color="${P.canopy}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect y="${Y + 20}" width="${W}" height="${H - Y}" fill="${P.lawnDark}"/>
    <path d="${light}" fill="${P.lawnLight}"/>
    <path d="${dark}" fill="${P.lawnDark}"/>
    <path d="${shadows}" fill="${P.canopy}" fill-opacity="0.2" filter="url(#hero-soft)"/>
    <rect y="${Y + 20}" width="${W}" height="${H - Y}" fill="url(#hero-lawn-shade)"/>
  </svg>`;

  const front = `${svgOpen(W, H, 'preserveAspectRatio="xMaxYMin slice" aria-hidden="true" focusable="false"')}
    <path d="${frond(1720, -80, 158, 760, 220, { leaflets: 34, leafLen: 230, leafWidth: 15, spread: 55 })}" fill="${P.canopyLift}"/>
    <path d="${frond(1690, -60, 128, 620, 120, { leaflets: 30, leafLen: 210, leafWidth: 14, spread: 50 })}" fill="${P.canopy}"/>
  </svg>`;

  return { sky, far, mid, lawn, front };
}

/* ------------------------------------------------------------------ */
/* Service illustrations, rasterized by the placeholder generator.     */
/* ------------------------------------------------------------------ */

function backdrop(W, H, horizon) {
  const P = PALETTE;
  return `<defs>
      <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${P.skyTop}"/><stop offset="1" stop-color="${P.skyLow}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#s)"/>
    <path d="${[palm(W * 0.18, horizon, H * 0.34, 10), palm(W * 0.82, horizon, H * 0.4, -14)].join('')}" fill="${P.hazePalm}"/>`;
}

export const SERVICE_ART = {
  'lawn-maintenance': (W, H) => {
    const P = PALETTE;
    const Y = H * 0.46;
    const [light, dark] = lawnStripes(W, H, Y, W * 0.5, -H * 0.4, W * 0.17);
    return `${svgOpen(W, H)}${backdrop(W, H, Y)}
      <path d="${hedge(-10, Y - H * 0.08, W + 20, H * 0.1, H * 0.025)}" fill="${P.hedge}"/>
      <rect y="${Y}" width="${W}" height="${H - Y}" fill="${P.lawnDark}"/>
      <path d="${light}" fill="${P.lawnLight}"/><path d="${dark}" fill="${P.lawnDark}"/>
      <path d="${frond(W + 60, -40, 150, W * 0.5, H * 0.12, { leaflets: 26, leafLen: W * 0.14, leafWidth: 11 })}" fill="${P.canopy}"/>
    </svg>`;
  },
  'bush-hedge-trimming': (W, H) => {
    const P = PALETTE;
    const Y = H * 0.5;
    const [light, dark] = lawnStripes(W, H, Y, W * 0.5, -H * 0.5, W * 0.2);
    const box = (x, y, w, h) => `M${x} ${y + h}L${x} ${y + 26}Q${x} ${y} ${x + 26} ${y}L${x + w - 26} ${y}Q${x + w} ${y} ${x + w} ${y + 26}L${x + w} ${y + h}Z`;
    return `${svgOpen(W, H)}${backdrop(W, H, Y)}
      <path d="${hedge(-10, Y - H * 0.12, W + 20, H * 0.14, H * 0.03)}" fill="${P.mid}"/>
      <rect y="${Y}" width="${W}" height="${H - Y}" fill="${P.lawnDark}"/>
      <path d="${light}" fill="${P.lawnLight}"/><path d="${dark}" fill="${P.lawnDark}"/>
      <path d="${box(W * 0.06, H * 0.5, W * 0.38, H * 0.26)}${box(W * 0.56, H * 0.5, W * 0.38, H * 0.26)}" fill="${P.hedge}"/>
      <path d="${box(W * 0.06, H * 0.5, W * 0.38, H * 0.05)}${box(W * 0.56, H * 0.5, W * 0.38, H * 0.05)}" fill="${P.mid}"/>
      <path d="${frond(-60, H + 40, -38, W * 0.5, -H * 0.02, { leaflets: 24, leafLen: W * 0.13, leafWidth: 11 })}" fill="${P.canopy}"/>
    </svg>`;
  },
  'mulching-planting-beds': (W, H) => {
    const P = PALETTE;
    const Y = H * 0.44;
    const bed = `M0 ${H * 0.62}C${W * 0.3} ${H * 0.5} ${W * 0.7} ${H * 0.56} ${W} ${H * 0.5}L${W} ${H}L0 ${H}Z`;
    const bedEdge = `M0 ${H * 0.82}C${W * 0.35} ${H * 0.72} ${W * 0.65} ${H * 0.8} ${W} ${H * 0.72}L${W} ${H}L0 ${H}Z`;
    return `${svgOpen(W, H)}${backdrop(W, H, Y)}
      <rect y="${Y}" width="${W}" height="${H - Y}" fill="${P.lawnLight}"/>
      <path d="${bed}" fill="${P.mulch}"/>
      <path d="${shrub(W * 0.2, H * 0.62, H * 0.17)}${shrub(W * 0.52, H * 0.6, H * 0.2)}${shrub(W * 0.82, H * 0.56, H * 0.16)}" fill="${P.hedge}"/>
      <circle cx="${W * 0.36}" cy="${H * 0.62}" r="${H * 0.018}" fill="${P.bloom}"/><circle cx="${W * 0.39}" cy="${H * 0.6}" r="${H * 0.014}" fill="${P.bloom}"/>
      <circle cx="${W * 0.68}" cy="${H * 0.58}" r="${H * 0.016}" fill="${P.bloom}"/>
      <path d="${bedEdge}" fill="${P.mulchLight}"/>
    </svg>`;
  },
  'tree-plant-installation': (W, H) => {
    const P = PALETTE;
    const Y = H * 0.56;
    let rows = '';
    for (let i = 0; i < 7; i += 1) rows += palm(W * (0.08 + i * 0.14), Y + 4, H * 0.16, (i % 2 ? 4 : -4), { fronds: 7 });
    const tx = W * 0.5;
    const ty = H * 0.9;
    const stakes = `M${tx - 110} ${ty}L${tx - 14} ${H * 0.6}L${tx - 6} ${H * 0.6}L${tx - 100} ${ty}Z M${tx + 110} ${ty}L${tx + 14} ${H * 0.6}L${tx + 6} ${H * 0.6}L${tx + 100} ${ty}Z`;
    return `${svgOpen(W, H)}${backdrop(W, H, Y)}
      <rect y="${Y}" width="${W}" height="${H - Y}" fill="${P.lawnLight}"/>
      <path d="${rows}" fill="${P.mid}"/>
      <ellipse cx="${tx}" cy="${ty}" rx="${W * 0.16}" ry="${H * 0.045}" fill="${P.mulch}"/>
      <path d="${palm(tx, ty, H * 0.62, 6, { fronds: 10, trunk: 0.035 })}" fill="${P.hedge}"/>
      <path d="${stakes}" fill="${P.mulchLight}"/>
    </svg>`;
  },
  'pressure-washing': (W, H) => {
    const P = PALETTE;
    const Y = H * 0.4;
    const vx = W * 0.5;
    const vy = -H * 0.6;
    let lines = '';
    for (let bx = -W; bx <= W * 2; bx += W * 0.09) {
      const hx = vx + ((bx - vx) * (Y - vy)) / (H - vy);
      lines += `M${r(bx)} ${H}L${r(hx)} ${Y}`;
    }
    for (let k = 1; k < 9; k += 1) {
      const y = Y + (H - Y) * (k / 9) ** 1.5;
      lines += `M0 ${r(y)}L${W} ${r(y)}`;
    }
    const clean = `M${W * 0.38} ${H}L${W * 0.58} ${Y}L${W} ${Y}L${W} ${H}Z`;
    return `${svgOpen(W, H)}${backdrop(W, H, Y)}
      <path d="${hedge(-10, Y - H * 0.08, W + 20, H * 0.1, H * 0.025)}" fill="${P.hedge}"/>
      <rect y="${Y}" width="${W}" height="${H - Y}" fill="${P.paverDirty}"/>
      <path d="${clean}" fill="${P.paver}"/>
      <path d="${lines}" stroke="${P.canopy}" stroke-opacity="0.22" stroke-width="3" fill="none"/>
    </svg>`;
  },
};

/** The hero composed flat, for the Open Graph card and the hero placeholder. */
export function heroFlat(W = HERO.width, H = HERO.height) {
  const layers = heroLayers();
  const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `${svgOpen(HERO.width, HERO.height, `width="${W}" height="${H}" preserveAspectRatio="xMaxYMax slice"`)}${['sky', 'far', 'mid', 'lawn', 'front'].map((k) => inner(layers[k])).join('')}</svg>`;
}

/**
 * The brand mark: one palm over a mowed lawn, inside a disc. Drawn on a 64 grid
 * so it holds up at favicon size. `id` keeps clip ids unique when it appears twice.
 */
export function mark(id = 'mark') {
  const P = PALETTE;
  const [light, dark] = lawnStripes(64, 64, 41, 32, 4, 9);
  // Fronds arch up and out from the crown, then droop at the tips.
  const crown = [
    leaf(33, 17, 6, 31, 3.4, 6),
    leaf(33, 17, 10, 16, 3.4, 5),
    leaf(33, 17, 20, 5, 3.1, 3),
    leaf(33, 17, 45, 4, 3.1, -3),
    leaf(33, 17, 56, 15, 3.4, -5),
    leaf(33, 17, 60, 30, 3.4, -6),
  ].join('');
  const trunk = 'M35.5 46Q32.4 31 32 17.5L34.2 17.5Q35.4 31 38.5 46Z';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <defs><clipPath id="${id}-c"><circle cx="32" cy="32" r="32"/></clipPath></defs>
    <g clip-path="url(#${id}-c)">
      <rect width="64" height="64" fill="${P.skyTop}"/>
      <rect y="41" width="64" height="23" fill="${P.lawnDark}"/>
      <path d="${light}" fill="${P.lawnLight}"/><path d="${dark}" fill="${P.lawnDark}"/>
      <path d="${hedge(-2, 37, 68, 6, 2)}" fill="${P.hedge}"/>
      <path d="${trunk}${crown}" fill="${P.canopy}"/>
    </g>
  </svg>`;
}
