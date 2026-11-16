/**
 * Catálogo de EJEMPLO. Las fotos son del catálogo de Vizzano (falta confirmar
 * permiso); nombres, precios y stock por talle son inventados.
 * Más adelante esto sale de Supabase con la misma forma (`Product`).
 */

export type ProductSize = { size: number; available: boolean };

export type Product = {
  id: string;
  /** Referencia del fabricante. */
  ref: string;
  name: string;
  category: string;
  /** Precio en pesos, sin decimales. */
  price: number;
  image: { src: string; width: number; height: number; alt: string };
  sizes: ProductSize[];
};

/** Talles 35 a 40; los que se pasan en `out` figuran sin stock. */
const sizes = (...out: number[]): ProductSize[] =>
  [35, 36, 37, 38, 39, 40].map((size) => ({ size, available: !out.includes(size) }));

const photo = (ref: string, width: number, height: number, alt: string) => ({
  src: `/placeholders/vizzano-${ref}.webp`,
  width,
  height,
  alt,
});

export const products: Product[] = [
  {
    id: "sandalia-nudo-dorada",
    ref: "6576.203",
    name: "Sandalia Nudo dorada",
    category: "Sandalias",
    price: 64900,
    image: photo("6576-203", 751, 476, "Sandalia dorada de taco bajo con tiras anudadas"),
    sizes: sizes(35),
  },
  {
    id: "zapato-pulsera-plata",
    ref: "1475.202",
    name: "Zapato Pulsera plata",
    category: "Zapatos",
    price: 72900,
    image: photo("1475-202", 719, 497, "Zapato plateado en punta con taco cuadrado y pulsera"),
    sizes: sizes(40),
  },
  {
    id: "stiletto-cobre",
    ref: "1456.200",
    name: "Stiletto bajo cobre",
    category: "Zapatos",
    price: 68900,
    image: photo("1456-200", 750, 472, "Stiletto de taco bajo color cobre metalizado"),
    sizes: sizes(35, 39),
  },
  {
    id: "sandalia-tiras-plata",
    ref: "6291.1819",
    name: "Sandalia Tiras plata",
    category: "Sandalias",
    price: 66900,
    image: photo("6291-1819", 757, 495, "Sandalia plateada de tiras con taco cuadrado"),
    sizes: sizes(),
  },
  {
    id: "sandalia-lazo-negra",
    ref: "6464.152",
    name: "Sandalia Lazo negra",
    category: "Sandalias",
    price: 74900,
    image: photo("6464-152", 504, 512, "Sandalia negra de taco cuadrado atada al tobillo"),
    sizes: sizes(36, 40),
  },
  {
    id: "sandalia-tachas-camel",
    ref: "6570.203",
    name: "Sandalia Tachas camel",
    category: "Sandalias",
    price: 59900,
    image: photo("6570-203", 750, 381, "Sandalia baja color camel con tachas"),
    sizes: sizes(38),
  },
  {
    id: "sandalia-plana-dorada",
    ref: "6371.174",
    name: "Sandalia plana dorada",
    category: "Sandalias",
    price: 49900,
    image: photo("6371-174", 748, 374, "Sandalia plana dorada con tira al tobillo"),
    sizes: sizes(),
  },
  {
    id: "chinela-dorada",
    ref: "6553.210",
    name: "Chinela dorada",
    category: "Sandalias",
    price: 44900,
    image: photo("6553-210", 750, 332, "Chinela plana dorada con anillo en el dedo"),
    sizes: sizes(35, 36),
  },
  {
    id: "botineta-chocolate",
    ref: "3077.125",
    name: "Botineta chocolate",
    category: "Botas",
    price: 89900,
    image: photo("3077-125", 618, 503, "Botineta baja color chocolate con cierre lateral"),
    sizes: sizes(37),
  },
  {
    id: "bota-larga-negra",
    ref: "3105.103",
    name: "Bota larga negra",
    category: "Botas",
    price: 119900,
    image: photo("3105-103", 222, 531, "Bota larga negra de taco alto"),
    sizes: sizes(35, 40),
  },
];

export const categories = Array.from(new Set(products.map((product) => product.category)));
