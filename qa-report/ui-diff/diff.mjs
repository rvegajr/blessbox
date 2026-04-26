import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'fs';
import path from 'path';

const SHOTS = '/Users/admin/Dev/YOLOProjects/BlessBox/qa-report/ui-diff/shots';
const DIFFS = '/Users/admin/Dev/YOLOProjects/BlessBox/qa-report/ui-diff/diffs';
fs.mkdirSync(DIFFS, { recursive: true });

const files = fs.readdirSync(SHOTS).filter((f) => f.endsWith('_prod.png'));
const results = [];

for (const prodFile of files) {
  const devFile = prodFile.replace('_prod.png', '_dev.png');
  if (!fs.existsSync(path.join(SHOTS, devFile))) continue;
  const slug = prodFile.replace('_prod.png', '');

  let prod = PNG.sync.read(fs.readFileSync(path.join(SHOTS, prodFile)));
  let dev = PNG.sync.read(fs.readFileSync(path.join(SHOTS, devFile)));

  // Pad to same size for diffing
  const w = Math.max(prod.width, dev.width);
  const h = Math.max(prod.height, dev.height);
  const pad = (img) => {
    if (img.width === w && img.height === h) return img;
    const out = new PNG({ width: w, height: h });
    out.data.fill(255);
    PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
    return out;
  };
  prod = pad(prod);
  dev = pad(dev);

  const diff = new PNG({ width: w, height: h });
  const mismatched = pixelmatch(prod.data, dev.data, diff.data, w, h, { threshold: 0.1 });
  const total = w * h;
  const pct = (mismatched / total) * 100;
  fs.writeFileSync(path.join(DIFFS, `${slug}_diff.png`), PNG.sync.write(diff));
  results.push({ slug, mismatched, total, pct, w, h });
}

results.sort((a, b) => b.pct - a.pct);
console.log('page'.padEnd(36), 'pct'.padStart(8), 'pixels'.padStart(12), 'size');
console.log('-'.repeat(80));
for (const r of results) {
  console.log(
    r.slug.padEnd(36),
    r.pct.toFixed(2).padStart(7) + '%',
    String(r.mismatched).padStart(12),
    `${r.w}x${r.h}`,
  );
}
fs.writeFileSync(path.join(DIFFS, '_summary.json'), JSON.stringify(results, null, 2));
