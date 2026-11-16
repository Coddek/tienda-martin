// Recorta el fondo blanco de una foto de catálogo y la guarda como WebP con transparencia.
// Uso: node scripts/cutout.mjs <entrada.jpg> <salida.webp>
// Solo sirve para fotos de producto sobre blanco liso. Las zonas blancas chicas
// (brillos del material) se conservan; las grandes (fondo, huecos entre tiras) se eliminan.
import sharp from "sharp";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Uso: node scripts/cutout.mjs <entrada.jpg> <salida.webp>");
  process.exit(1);
}

const WHITE = 236; // mínimo de canal para considerar "blanco"
const MIN_AREA = 350; // px: regiones blancas más chicas que esto son brillo, no fondo
const SOFT = 190; // desde acá hacia WHITE el borde se va haciendo transparente

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const n = w * h;
const lum = (i) => Math.min(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);

// 1) Componentes conexas de píxeles blancos
const label = new Int32Array(n).fill(-1);
const removed = new Uint8Array(n);
const queue = new Int32Array(n);
for (let s = 0; s < n; s++) {
  if (label[s] !== -1 || lum(s) < WHITE) continue;
  let head = 0;
  let tail = 0;
  queue[tail++] = s;
  label[s] = s;
  let touchesBorder = false;
  while (head < tail) {
    const p = queue[head++];
    const x = p % w;
    const y = (p - x) / w;
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touchesBorder = true;
    for (const q of [p - 1, p + 1, p - w, p + w]) {
      if (q < 0 || q >= n) continue;
      if (Math.abs((q % w) - x) > 1) continue;
      if (label[q] !== -1 || lum(q) < WHITE) continue;
      label[q] = s;
      queue[tail++] = q;
    }
  }
  if (touchesBorder || tail >= MIN_AREA) {
    for (let k = 0; k < tail; k++) removed[queue[k]] = 1;
  }
}

// 2) Alfa: fondo transparente y borde suavizado (quitando el blanco mezclado)
for (let p = 0; p < n; p++) {
  const i = p * 4;
  if (removed[p]) {
    data[i + 3] = 0;
    continue;
  }
  const x = p % w;
  const nearRemoved =
    (x > 0 && removed[p - 1]) ||
    (x < w - 1 && removed[p + 1]) ||
    (p >= w && removed[p - w]) ||
    (p < n - w && removed[p + w]);
  if (!nearRemoved) continue;
  const l = lum(p);
  if (l <= SOFT) continue;
  const a = Math.max(0.15, 1 - (l - SOFT) / (255 - SOFT));
  for (let c = 0; c < 3; c++) {
    const v = (data[i + c] - (1 - a) * 255) / a;
    data[i + c] = Math.max(0, Math.min(255, Math.round(v)));
  }
  data[i + 3] = Math.round(a * 255);
}

const out = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
  .trim()
  .webp({ quality: 86, alphaQuality: 90 })
  .toFile(output);
console.log(`${output}: ${out.width}x${out.height}, ${out.size} bytes`);
