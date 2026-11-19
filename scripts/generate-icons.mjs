import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const source = readFileSync(new URL('../public/icons/icon.svg', import.meta.url), 'utf8');
for (const size of [192, 512]) {
  const png = new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(new URL(`../public/icons/icon-${size}.png`, import.meta.url), png);
}
const maskable = source.replace('rx="112"', 'rx="0"');
writeFileSync(new URL('../public/icons/maskable-512.png', import.meta.url), new Resvg(maskable, { fitTo: { mode: 'width', value: 512 } }).render().asPng());
