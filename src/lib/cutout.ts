/**
 * Recorte de fondo en el navegador, para las fotos que suben desde el editor.
 * Pensado para fotos con el celular sobre un fondo liso y claro (cartulina,
 * sábana, pared): toma el color del fondo de los bordes de la foto y saca todo
 * lo parecido que esté conectado al borde, más los huecos grandes de ese color
 * (entre tiras). Los brillos chicos del material se conservan.
 * No sirve para fondos con dibujos: para eso está la opción de no recortar.
 */

export type CutoutResult = {
  blob: Blob;
  width: number;
  height: number;
  /** Color promedio del zapato: se propone como color del botón redondo. */
  swatch: string;
  type: string;
};

/** Lado mayor de la foto que se guarda. */
const MAX_SIDE = 900;
/** Lado mayor con el que se procesa (más chico = más rápido en el celular). */
const WORK_SIDE = 1200;

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la foto."));
    };
    img.src = url;
  });
}

function canvasOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("El navegador no permite procesar la foto.");
  return { canvas, ctx };
}

/** Color típico del fondo: la mediana de cada canal sobre el borde de la foto. */
function borderColor(data: Uint8ClampedArray, w: number, h: number): [number, number, number] {
  const r: number[] = [];
  const g: number[] = [];
  const b: number[] = [];
  const push = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    r.push(data[i]);
    g.push(data[i + 1]);
    b.push(data[i + 2]);
  };
  const step = Math.max(1, Math.floor(Math.min(w, h) / 200));
  for (let x = 0; x < w; x += step) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y += step) {
    push(0, y);
    push(w - 1, y);
  }
  const median = (values: number[]) => values.sort((a, c) => a - c)[Math.floor(values.length / 2)];
  return [median(r), median(g), median(b)];
}

/**
 * Saca el fondo de `data` (RGBA) en el lugar. `tolerance`: cuánto puede
 * diferir un píxel del color del fondo para considerarlo fondo (sombras
 * suaves, luz despareja). Devuelve cuántos píxeles quedaron del zapato.
 */
export function removeBackground(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  tolerance: number,
): number {
  const n = w * h;
  const [br, bg, bb] = borderColor(data, w, h);
  // Distancia al fondo: el canal que más se aleja (las sombras grises cuentan menos).
  const dist = (p: number) => {
    const i = p * 4;
    return Math.max(Math.abs(data[i] - br), Math.abs(data[i + 1] - bg), Math.abs(data[i + 2] - bb));
  };
  const isBg = (p: number) => dist(p) <= tolerance;

  // Regiones de color fondo: se sacan las que tocan el borde y las grandes (huecos).
  const minArea = Math.round(n * 0.0015);
  const seen = new Uint8Array(n);
  const removed = new Uint8Array(n);
  const queue = new Int32Array(n);
  for (let s = 0; s < n; s++) {
    if (seen[s] || !isBg(s)) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = s;
    seen[s] = 1;
    let touchesBorder = false;
    while (head < tail) {
      const p = queue[head++];
      const x = p % w;
      const y = (p - x) / w;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touchesBorder = true;
      const visit = (q: number) => {
        if (!seen[q] && isBg(q)) {
          seen[q] = 1;
          queue[tail++] = q;
        }
      };
      if (x > 0) visit(p - 1);
      if (x < w - 1) visit(p + 1);
      if (y > 0) visit(p - w);
      if (y < h - 1) visit(p + w);
    }
    if (touchesBorder || tail >= minArea) {
      for (let k = 0; k < tail; k++) removed[queue[k]] = 1;
    }
  }

  // Alfa: fondo transparente y borde suave (sin el halo del color del fondo).
  let kept = 0;
  const soft = tolerance * 2.2;
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    if (removed[p]) {
      data[i + 3] = 0;
      continue;
    }
    kept++;
    const x = p % w;
    const nearRemoved =
      (x > 0 && removed[p - 1]) ||
      (x < w - 1 && removed[p + 1]) ||
      (p >= w && removed[p - w]) ||
      (p < n - w && removed[p + w]);
    if (!nearRemoved) continue;
    const d = dist(p);
    if (d >= soft) continue;
    data[i + 3] = Math.round(255 * Math.max(0.2, d / soft));
  }
  return kept;
}

/** Caja que encierra lo que no es transparente. */
function opaqueBox(data: Uint8ClampedArray, w: number, h: number) {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > 24) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function averageColor(data: Uint8ClampedArray) {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 16) {
    if (data[i + 3] < 200) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }
  if (!count) return "#1E1E1E";
  const hex = (v: number) => Math.round(v / count).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase();
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    // WebP liviano con transparencia. Si el navegador no sabe hacer WebP
    // (algunos iPhone viejos), devuelve PNG, que también es transparente.
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo guardar la foto."))), "image/webp", 0.86),
  );
}

/**
 * Prepara la foto para la página: recorta el fondo (si `cut`), la ajusta al
 * zapato y la achica. `tolerance` 10–80; con 34 anda bien sobre cartulina blanca.
 */
export async function preparePhoto(file: Blob, { cut, tolerance }: { cut: boolean; tolerance: number }) {
  const img = await loadImage(file);
  const scale = Math.min(1, WORK_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const work = canvasOf(w, h);
  work.ctx.drawImage(img, 0, 0, w, h);
  const imageData = work.ctx.getImageData(0, 0, w, h);

  if (cut) {
    const kept = removeBackground(imageData.data, w, h, tolerance);
    if (kept < w * h * 0.01) {
      throw new Error("El recorte se llevó casi toda la foto. Bajá la fuerza del recorte o probá sin recortar.");
    }
    work.ctx.putImageData(imageData, 0, 0);
  }

  const box = (cut && opaqueBox(imageData.data, w, h)) || { x: 0, y: 0, w, h };
  // Un poco de aire alrededor del zapato.
  const pad = Math.round(Math.max(box.w, box.h) * 0.04);
  const sx = Math.max(0, box.x - pad);
  const sy = Math.max(0, box.y - pad);
  const sw = Math.min(w - sx, box.w + pad * 2);
  const sh = Math.min(h - sy, box.h + pad * 2);
  const outScale = Math.min(1, MAX_SIDE / Math.max(sw, sh));
  const out = canvasOf(Math.round(sw * outScale), Math.round(sh * outScale));
  out.ctx.drawImage(work.canvas, sx, sy, sw, sh, 0, 0, out.canvas.width, out.canvas.height);

  const blob = await toBlob(out.canvas);
  const swatch = averageColor(out.ctx.getImageData(0, 0, out.canvas.width, out.canvas.height).data);
  return {
    blob,
    width: out.canvas.width,
    height: out.canvas.height,
    swatch,
    type: blob.type || "image/png",
  } satisfies CutoutResult;
}
