import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'node:fs';

const pub = 'public';
const BG = '#141414';

// 1. Standard PNGs from favicon.svg (rounded, transparent corners OK for browsers)
for (const size of [16, 32, 48]) {
  await sharp(`${pub}/favicon.svg`).resize(size, size).png().toFile(`${pub}/favicon-${size}x${size}.png`);
  console.log(`favicon-${size}x${size}.png`);
}

// 2. PWA icons (any)
for (const size of [192, 512]) {
  await sharp(`${pub}/favicon.svg`).resize(size, size).png().toFile(`${pub}/icon-${size}x${size}.png`);
  console.log(`icon-${size}x${size}.png`);
}

// 3. Apple touch icon 180: opaque square, no transparency (iOS fills corners itself)
await sharp(`${pub}/favicon.svg`)
  .resize(180, 180)
  .flatten({ background: BG })
  .png()
  .toFile(`${pub}/apple-touch-icon.png`);
console.log('apple-touch-icon.png');

// 4. Maskable: 80% icon centered on solid BG (safe zone for Android adaptive)
for (const size of [192, 512]) {
  const inner = Math.round(size * 0.8);
  const icon = await sharp(`${pub}/favicon.svg`).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: icon, left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) }])
    .png()
    .toFile(`${pub}/maskable-icon-${size}x${size}.png`);
  console.log(`maskable-icon-${size}x${size}.png`);
}

// 5. Windows tile 150
await sharp(`${pub}/favicon.svg`).resize(150, 150).png().toFile(`${pub}/mstile-150x150.png`);
console.log('mstile-150x150.png');

// 6. favicon.ico multi-size (16/32/48)
const ico = await pngToIco([
  `${pub}/favicon-16x16.png`,
  `${pub}/favicon-32x32.png`,
  `${pub}/favicon-48x48.png`,
]);
fs.writeFileSync(`${pub}/favicon.ico`, ico);
console.log('favicon.ico', ico.length, 'bytes');
