/**
 * Catálogo de EJEMPLO. Las fotos son del catálogo de Vizzano (falta confirmar
 * permiso); nombres, precios y stock por talle son inventados.
 * Más adelante esto sale de Supabase con la misma forma (`Product`).
 */

export type ProductSize = { size: number; available: boolean };

export type ProductTag = "nuevo" | "ultimos" | "oferta";

export type ProductImage = { src: string; width: number; height: number; alt: string };

/** Un color del mismo modelo, con su foto. `swatch` es el color del botón redondo. */
export type ProductVariant = { color: string; swatch: string; image: ProductImage };

export type Product = {
  id: string;
  /** Referencia del fabricante. */
  ref: string;
  name: string;
  category: string;
  /** Precio en pesos, sin decimales. */
  price: number;
  /** Precio anterior, tachado (solo en ofertas). */
  compareAtPrice?: number;
  tag?: ProductTag;
  /** Foto principal (la del primer color). */
  image: ProductImage;
  /** Colores disponibles. Si no hay, el modelo viene en un solo color. */
  variants?: ProductVariant[];
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
    tag: "nuevo",
    image: photo("6576-203", 751, 476, "Sandalia dorada de taco bajo con tiras anudadas"),
    sizes: sizes(35),
  },
  {
    id: "zapato-pulsera",
    ref: "1475.202",
    name: "Zapato Pulsera",
    category: "Zapatos",
    price: 72900,
    image: photo("1475-202", 719, 497, "Zapato plateado en punta con taco cuadrado y pulsera"),
    variants: [
      {
        color: "Plata",
        swatch: "#C9CCD1",
        image: photo("1475-202", 719, 497, "Zapato plateado en punta con taco cuadrado y pulsera"),
      },
      {
        color: "Dorado",
        swatch: "#D8BE7A",
        image: photo("1475-202-b", 718, 497, "Zapato dorado en punta con taco cuadrado y pulsera"),
      },
    ],
    sizes: sizes(40),
  },
  {
    id: "stiletto-cobre",
    ref: "1456.200",
    name: "Stiletto bajo cobre",
    category: "Zapatos",
    price: 59900,
    compareAtPrice: 68900,
    tag: "oferta",
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
    id: "sandalia-lazo",
    ref: "6464.152",
    name: "Sandalia Lazo",
    category: "Sandalias",
    price: 74900,
    tag: "ultimos",
    image: photo("6464-152", 504, 512, "Sandalia negra de taco cuadrado atada al tobillo"),
    variants: [
      {
        color: "Negro",
        swatch: "#1E1E1E",
        image: photo("6464-152", 504, 512, "Sandalia negra de taco cuadrado atada al tobillo"),
      },
      {
        color: "Chocolate",
        swatch: "#6B4A32",
        image: photo("6464-152-b", 505, 513, "Sandalia color chocolate de taco cuadrado atada al tobillo"),
      },
    ],
    sizes: sizes(36, 40),
  },
  {
    id: "sandalia-tachas",
    ref: "6570.203",
    name: "Sandalia Tachas",
    category: "Sandalias",
    price: 59900,
    image: photo("6570-203", 750, 381, "Sandalia baja color camel con tachas"),
    variants: [
      {
        color: "Camel",
        swatch: "#B9793F",
        image: photo("6570-203", 750, 381, "Sandalia baja color camel con tachas"),
      },
      {
        color: "Marrón",
        swatch: "#8A4B22",
        image: photo("6570-203-b", 750, 381, "Sandalia baja color marrón con tachas"),
      },
    ],
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
    tag: "nuevo",
    image: photo("3077-125", 618, 503, "Botineta baja color chocolate con cierre lateral"),
    sizes: sizes(37),
  },
  {
    id: "bota-larga",
    ref: "3105.103",
    name: "Bota larga",
    category: "Botas",
    price: 119900,
    image: photo("3105-103", 222, 531, "Bota larga negra de taco alto"),
    variants: [
      { color: "Negro", swatch: "#1E1E1E", image: photo("3105-103", 222, 531, "Bota larga negra de taco alto") },
      {
        color: "Chocolate",
        swatch: "#5A3526",
        image: photo("3105-103-b", 222, 531, "Bota larga color chocolate de taco alto"),
      },
    ],
    sizes: sizes(35, 40),
  },
];

export const allSizes = Array.from(
  new Set(products.flatMap((product) => product.sizes.map((s) => s.size))),
).sort((a, b) => a - b);

export const getProduct = (id: string) => products.find((product) => product.id === id);

export const categories = Array.from(new Set(products.map((product) => product.category)));
