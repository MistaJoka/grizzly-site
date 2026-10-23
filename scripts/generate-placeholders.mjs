import { access, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { heroFlat, SERVICE_ART } from '../src/lib/art.mjs';

const OUT = 'src/assets/images';
export const OG_FILE = 'public/og/default.jpg';

// Illustrated placeholders (flat vector scenes, clearly not photographs) drawn from
// src/lib/art.mjs. Replace with Alex's own photos (same paths) before launch.
// See README "Alex must fill in".
export const FILES = [
  ['hero.jpg', 2400, 1600],
  ['services/lawn-maintenance.jpg', 1600, 1200],
  ['services/bush-hedge-trimming.jpg', 1600, 1200],
  ['services/mulching-planting-beds.jpg', 1600, 1200],
  ['services/tree-plant-installation.jpg', 1600, 1200],
  ['services/pressure-washing.jpg', 1600, 1200],
];

function svg(name, width, height) {
  const slug = name.replace(/^services\//, '').replace(/\.jpg$/, '');
  const draw = SERVICE_ART[slug];
  // Service scenes are drawn in their own viewBox, so pin the raster size on them.
  const markup = draw
    ? draw(width, height).replace('<svg ', `<svg width="${width}" height="${height}" `)
    : heroFlat(width, height);
  return Buffer.from(markup);
}

const exists = (path) => access(path).then(() => true, () => false);

async function generate() {
for (const [name, width, height] of FILES) {
  const target = join(OUT, name);
  // Never overwrite a real photo that has been dropped in at this path.
  if (await exists(target)) continue;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, await sharp(svg(name, width, height)).jpeg({ quality: 86 }).toBuffer());
}

// Open Graph default lives in public/ because social crawlers need a stable, unhashed URL.
await mkdir('public/og', { recursive: true });
if (!(await exists(OG_FILE))) {
  await writeFile(OG_FILE, await sharp(svg('og.jpg', 1200, 630)).jpeg({ quality: 86 }).toBuffer());
}

console.log(`placeholder images ready (${FILES.length + 1})`);
}

// Only generate when invoked directly, so tests can import the manifest.
if (import.meta.url === `file://${process.argv[1]}`) await generate();
