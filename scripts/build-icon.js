// Generates build/icon.ico and build/icon.png from the Ravro Kanban design.
// Run: node scripts/build-icon.js

const Jimp      = require('jimp');
const pngToIco  = require('png-to-ico');
const path      = require('path');
const fs        = require('fs');

const SIZES = [16, 32, 48, 64, 128, 256];

function lerp(a, b, t) {
  return Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));
}

function px(r, g, b, a = 255) {
  return Jimp.rgbaToInt(r, g, b, a);
}

function createIconAtSize(size) {
  return new Promise((resolve, reject) => {
    // Dark background #05070b
    new Jimp(size, size, px(5, 7, 11), (err, img) => {
      if (err) { reject(err); return; }

      const pad    = Math.max(1, Math.round(size * 0.1));
      const gap    = Math.max(1, Math.round(size * 0.035));
      const cols   = 3;
      const colW   = Math.floor((size - 2 * pad - (cols - 1) * gap) / cols);
      const colH   = Math.round(size * 0.75);
      const colY   = pad;

      for (let ci = 0; ci < cols; ci++) {
        const colX = pad + ci * (colW + gap);

        // Metallic column gradient: #cfd4dd → #f5f7fa → #c0c5cf → #8f949f
        for (let y = colY; y < colY + colH; y++) {
          const t = (y - colY) / colH;
          let r, g, b;
          if (t < 0.4) {
            const tt = t / 0.4;
            r = lerp(207, 245, tt); g = lerp(212, 247, tt); b = lerp(221, 250, tt);
          } else if (t < 0.7) {
            const tt = (t - 0.4) / 0.3;
            r = lerp(245, 192, tt); g = lerp(247, 197, tt); b = lerp(250, 207, tt);
          } else {
            const tt = (t - 0.7) / 0.3;
            r = lerp(192, 143, tt); g = lerp(197, 148, tt); b = lerp(207, 159, tt);
          }
          for (let x = colX; x < colX + colW; x++) {
            img.setPixelColor(px(r, g, b), x, y);
          }
        }

        // Cards (skip at 16px — too tiny)
        if (size >= 32) {
          const cp = Math.max(1, Math.round(colW * 0.1));
          const ch = Math.max(3, Math.round(colH * 0.14));
          const cg = Math.max(1, Math.round(ch * 0.45));

          for (let ki = 0; ki < 2; ki++) {
            const cy = colY + cp + ki * (ch + cg);
            if (cy + ch > colY + colH) continue;

            for (let y = cy; y < cy + ch; y++) {
              for (let x = colX + cp; x < colX + colW - cp; x++) {
                const t = (y - cy) / ch;
                // Card: light grey fading to slightly greenish
                const r  = lerp(247, 195, t);
                const gv = lerp(252, 240, t);
                const bv = lerp(252, 210, t);
                img.setPixelColor(px(r, gv, bv), x, y);
              }
            }
          }
        }
      }

      resolve(img);
    });
  });
}

async function main() {
  const buildDir = path.join(__dirname, '..', 'build');
  const iconsDir = path.join(buildDir, 'icons');
  fs.mkdirSync(iconsDir, { recursive: true });

  console.log('Generating icon sizes…');
  const pngPaths = [];

  for (const size of SIZES) {
    const img = await createIconAtSize(size);
    const p   = path.join(iconsDir, `${size}.png`);
    await img.writeAsync(p);
    pngPaths.push(p);
    console.log(`  ${size}x${size} ✓`);
  }

  // Save the 256x256 as the reference PNG
  const mainImg = await createIconAtSize(256);
  await mainImg.writeAsync(path.join(buildDir, 'icon.png'));

  // Build the ICO
  const icoPath = path.join(buildDir, 'icon.ico');
  const buf     = await pngToIco(pngPaths);
  fs.writeFileSync(icoPath, buf);
  console.log('\nWrote:', icoPath);

  // Clean up per-size PNGs
  pngPaths.forEach(p => fs.unlinkSync(p));
  fs.rmdirSync(iconsDir);

  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
