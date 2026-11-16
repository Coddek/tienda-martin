/**
 * Isotipo: dos formas que se enlazan.
 * PROVISORIO: redibujado a mano a partir de un PNG de 165×95. Reemplazar estos
 * trazos por los del archivo original cuando esté. Los usan tanto el SVG
 * (celular) como la extrusión 3D (escritorio), así que se cambia en un solo lugar.
 */
export const ISOTIPO_VIEWBOX = { width: 186, height: 112 };

const LEFT_OUTER =
  "M20 36C45 22 70 14 82 14C100 14 108 28 108 46L108 62C108 80 90 86 72 90C55 94 35 98 20 98Z";
const LEFT_INNER =
  "M31 43C50 33 70 25 81 25C92 25 97 34 97 46L97 62C97 72 86 76 70 80C55 84 42 87 31 87Z";

/** Espeja un trazo en horizontal (solo comandos absolutos M, C, L, Z). */
function mirror(d: string): string {
  const w = ISOTIPO_VIEWBOX.width;
  return d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${w - Number(x)} ${y}`);
}

/** Cada forma es un anillo: contorno exterior + hueco (fill-rule evenodd). */
export const ISOTIPO_SHAPES = {
  left: `${LEFT_OUTER} ${LEFT_INNER}`,
  right: `${mirror(LEFT_OUTER)} ${mirror(LEFT_INNER)}`,
} as const;

/** Contrato común de las dos versiones del isotipo (SVG y 3D). */
export type IsotipoHandle = {
  /** 0 = formas enlazadas, 1 = separadas y desvanecidas. */
  setSplit: (value: number) => void;
};
