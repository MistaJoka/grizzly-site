import { access, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const OUT = 'src/assets/images';
export const OG_FILE = 'public/og/default.jpg';
const PALETTE = ['#2F4A33', '#6B4528', '#1F3324', '#4A3520', '#3C5A40'];

// Flat brand-color placeholders with NO text, so they are never mistaken for real photos.
// Replace with Alex's own photos (same paths) before launch. See README "Alex must fill in".
export const FILES = [
  ['hero.jpg', 2400, 1600],
  ['services/lawn-maintenance.jpg', 1600, 1200],
  ['services/bush-hedge-trimming.jpg', 1600, 1200],
  ['services/mulching-planting-beds.jpg', 1600, 1200],
  ['services/tree-plant-installation.jpg', 1600, 1200],
  ['services/pressure-washing.jpg', 1600, 1200],
];

function svg(width, height, color) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#1F1812"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`);
}

const exists = (path) => access(path).then(() => true, () => false);

async function generate() {
let index = 0;
for (const [name, width, height] of FILES) {
  const target = join(OUT, name);
  // Never overwrite a real photo that has been dropped in at this path.
  if (await exists(target)) { index += 1; continue; }
  await mkdir(dirname(target), { recursive: true });
  const buffer = await sharp(svg(width, height, PALETTE[index % PALETTE.length]))
    .jpeg({ quality: 82 })
    .toBuffer();
  await writeFile(target, buffer);
  index += 1;
}

// Open Graph default lives in public/ because social crawlers need a stable, unhashed URL.
await mkdir('public/og', { recursive: true });
if (!(await exists(OG_FILE))) {
  await writeFile(OG_FILE, await sharp(svg(1200, 630, PALETTE[0])).jpeg({ quality: 82 }).toBuffer());
}

console.log(`generated ${FILES.length + 1} placeholder images`);
}

// Only generate when invoked directly, so tests can import the manifest.
if (import.meta.url === `file://${process.argv[1]}`) await generate();
