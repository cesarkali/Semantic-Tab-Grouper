// Rasteriza docs/favicon.svg nos tamanhos que navegadores/SO pedem
// (aba do navegador, atalho no celular, PWA/manifest).
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs');
const SVG = fs.readFileSync(path.join(OUT, 'favicon.svg'));

const targets = [
  ['favicon-16.png', 16],
  ['favicon-32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512]
];

for (const [name, size] of targets) {
  await sharp(SVG).resize(size, size).png().toFile(`${OUT}/${name}`);
  console.log(name, 'ok');
}
