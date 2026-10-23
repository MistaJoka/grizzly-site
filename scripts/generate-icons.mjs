// Writes the favicon set from the brand mark in src/lib/art.mjs.
// Run with `node scripts/generate-icons.mjs` after changing the mark.
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { mark } from '../src/lib/art.mjs';

const svg = mark('icon').replace(' aria-hidden="true" focusable="false"', '');
const sized = (n) => Buffer.from(svg.replace('viewBox', `width="${n}" height="${n}" viewBox`));

await writeFile(new URL('../public/favicon.svg', import.meta.url), svg);
await sharp(sized(32)).png().toFile(new URL('../public/favicon-32.png', import.meta.url).pathname);
// The touch icon sits on a square tile; iOS rounds the corners itself.
await sharp({ create: { width: 180, height: 180, channels: 4, background: '#CFE5DD' } })
  .composite([{ input: await sharp(sized(180)).png().toBuffer() }])
  .png()
  .toFile(new URL('../public/apple-touch-icon.png', import.meta.url).pathname);
