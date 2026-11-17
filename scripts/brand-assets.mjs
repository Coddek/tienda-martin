// Genera el ícono de la pestaña y la imagen para compartir la portada a partir
// del isotipo (src/components/brand/isotipo-paths.ts) y de las fotos destacadas.
// Uso: node scripts/brand-assets.mjs
// Correrlo de nuevo al cambiar colores, isotipo o destacados.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const app = path.join(root, "src/app");

// Copiados de site.config.ts (este script no puede importar TypeScript).
const INK = "#123223";
const PAPER = "#F0F1EB";
const MINT = "#B9D0BB";
const GOLD = "#C8A662";
// En dos líneas, para que no toque las fotos de la derecha.
const TAGLINE = ["Calzado femenino", "Elegante, para todos los días."];
const SHOES = ["vizzano-1475-202.webp", "vizzano-6576-203.webp", "vizzano-3077-125.webp"];

// Trazos del isotipo y del logotipo, leídos de los mismos archivos que usa el sitio.
const brand = (file) => fs.readFileSync(path.join(root, "src/components/brand", file), "utf8");
const isoSource = brand("isotipo-paths.ts");
const wordSource = brand("wordmark-paths.ts");
const pick = (name) => {
  const match = isoSource.match(new RegExp(`const ${name} =\\s*"([^"]+)"`));
  if (!match) throw new Error(`No encuentro ${name} en isotipo-paths.ts`);
  return match[1];
};
const viewBox = (source) => {
  const match = source.match(/width: ([\d.]+), height: ([\d.]+)/);
  return [Number(match[1]), Number(match[2])];
};
const [W, H] = viewBox(isoSource);
const isotipo = (fill) =>
  [pick("ISOTIPO_FULL")]
    .map((d) => `<path d="${d}" fill="${fill}" fill-rule="evenodd"/>`)
    .join("");
const [WW, WH] = viewBox(wordSource);
const letters = [...wordSource.matchAll(/^ {2}"(M[^"]+)",$/gm)].map((m) => m[1]);
if (letters.length === 0) throw new Error("No encuentro las letras en wordmark-paths.ts");
const wordmark = (fill) =>
  letters.map((d) => `<path d="${d}" fill="${fill}" fill-rule="evenodd"/>`).join("");

// --- Logotipo como archivo: el encabezado y el pie lo usan de máscara (toma el color del texto) ---
fs.writeFileSync(
  path.join(root, "public/logotipo.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WW} ${WH}">${wordmark("#000")}</svg>\n`,
);

// --- Ícono de la pestaña (SVG, se ve nítido en cualquier tamaño) ---
const iconScale = 52 / W;
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="${INK}"/>
<g transform="translate(${(64 - W * iconScale) / 2} ${(64 - H * iconScale) / 2}) scale(${iconScale})">${isotipo(GOLD)}</g>
</svg>
`;
fs.writeFileSync(path.join(app, "icon.svg"), icon);

// --- Ícono para la pantalla de inicio del iPhone (PNG 180×180) ---
await sharp(Buffer.from(icon.replace('rx="14"', 'rx="0"')), { density: 300 })
  .resize(180, 180)
  .png()
  .toFile(path.join(app, "apple-icon.png"));

// --- Imagen al compartir la portada (1200×630) ---
const ogW = 1200;
const ogH = 630;
const ogScale = 230 / W;
const background = `<svg xmlns="http://www.w3.org/2000/svg" width="${ogW}" height="${ogH}">
<defs>
  <radialGradient id="g1" cx="0.25" cy="0.3" r="0.6">
    <stop offset="0" stop-color="${GOLD}" stop-opacity="0.22"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="g2" cx="0.78" cy="0.7" r="0.55">
    <stop offset="0" stop-color="${MINT}" stop-opacity="0.2"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="100%" height="100%" fill="${INK}"/>
<rect width="100%" height="100%" fill="url(#g1)"/>
<rect width="100%" height="100%" fill="url(#g2)"/>
<g transform="translate(80 110) scale(${ogScale})">${isotipo(GOLD)}</g>
<g transform="translate(80 360) scale(${560 / WW})">${wordmark(PAPER)}</g>
${TAGLINE.map((line, i) => `<text x="82" y="${525 + i * 38}" font-family="Archivo, Segoe UI, Arial, sans-serif" font-size="27" letter-spacing="2" fill="${MINT}">${line}</text>`).join("\n")}
</svg>`;

const shoeTiles = await Promise.all(
  SHOES.map(async (file, i) => {
    const input = await sharp(path.join(root, "public/placeholders", file))
      .resize(i === 0 ? 440 : 290, i === 0 ? 250 : 190, { fit: "inside" })
      .toBuffer();
    const spots = [
      [720, 70],
      [690, 360],
      [935, 345],
    ];
    const [left, top] = spots[i];
    return { input, left, top };
  }),
);

await sharp(Buffer.from(background))
  .composite(shoeTiles)
  .png({ compressionLevel: 9 })
  .toFile(path.join(app, "opengraph-image.png"));
fs.writeFileSync(path.join(app, "opengraph-image.alt.txt"), "Martin, calzado femenino");

console.log("icon.svg, apple-icon.png y opengraph-image.png generados en src/app");
