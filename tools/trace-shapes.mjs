



import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { Potrace } = require('potrace');
const Jimp = require('jimp');

const COUNT = 35;

function largestSubpath(d) {
  const segs = d.split(/(?=M)/).filter(Boolean);
  let best = segs[0] || '';
  for (const s of segs) if (s.length > best.length) best = s;
  best = best.trim();
  if (!/[zZ]\s*$/.test(best)) best += ' Z';
  return best;
}

function trace(file) {
  return new Promise((resolve, reject) => {
    Jimp.read(file).then((img) => {
      const { width: w, height: h } = img.bitmap;
      img.scan(0, 0, w, h, function (x, y, idx) {
        const v = this.bitmap.data[idx + 3] > 128 ? 0 : 255; 
        this.bitmap.data[idx] = this.bitmap.data[idx + 1] = this.bitmap.data[idx + 2] = v;
        this.bitmap.data[idx + 3] = 255;
      });
      const p = new Potrace({ threshold: 128, turdSize: 60, optCurve: true, alphaMax: 1.2 });
      p.loadImage(img, (err) => {
        if (err) return reject(err);
        const m = p.getPathTag().match(/ d="([^"]+)"/);
        resolve(m ? largestSubpath(m[1]) : '');
      });
    }).catch(reject);
  });
}

const paths = [];
for (let i = 0; i < COUNT; i++) {
  paths.push(await trace(`public/shapes/shape-${i}.png`));
  process.stdout.write(`traced ${i + 1}/${COUNT}\r`);
}
fs.writeFileSync('src/shapes-paths.json', JSON.stringify(paths));
console.log(`\nwrote src/shapes-paths.json (${paths.length} paths, ${JSON.stringify(paths).length} bytes)`);
