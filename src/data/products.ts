/**
 * Forma del catálogo y catálogo de EJEMPLO. Con Supabase configurado y con
 * productos cargados, el catálogo sale de la base (ver src/lib/catalog.ts) con
 * esta misma forma; mientras tanto se muestra este ejemplo. Las fotos son del
 * catálogo de Vizzano (el local es cliente de la marca); nombres, precios y stock son inventados.
 */

/** Cuánto queda de un talle. La página nunca muestra el número exacto. */
export type StockLevel = "disponible" | "quedan2" | "ultimo" | "agotado";

/** `size` es el talle argentino (el que se ve); `sizeBr`, el de la etiqueta brasileña. */
export type ProductSize = { size: number; sizeBr: number | null; stock: StockLevel };

export type ProductTag = "nuevo" | "ultimos" | "oferta";

export type ProductImage = { src: string; width: number; height: number; alt: string };

/** Un color del modelo, con su foto y su stock por talle. `swatch` es el color del botón redondo. */
export type ProductVariant = {
  color: string;
  swatch: string;
  image: ProductImage;
  sizes: ProductSize[];
};

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
  /** Aparece en "Lo más elegido" de la portada. */
  featured?: boolean;
  /** Foto principal (la del primer color). */
  image: ProductImage;
  /** Al menos uno. Con un solo color no se muestra el selector. */
  variants: ProductVariant[];
};

export const isAvailable = (size: ProductSize) => size.stock !== "agotado";

/** Con un solo color, el nombre del color no se agrega al mensaje ni al favorito. */
export const colorName = (product: Product, variant: ProductVariant) =>
  product.variants.length > 1 ? variant.color : null;

/** Talles 35 a 40 (argentinos). `out` = sin stock, `last` = último par, `two` = quedan 2. */
const sizes = (
  { out = [], last = [], two = [] }: { out?: number[]; last?: number[]; two?: number[] } = {},
): ProductSize[] =>
  [35, 36, 37, 38, 39, 40].map((size) => ({
    size,
    sizeBr: size - 1,
    stock: out.includes(size)
      ? "agotado"
      : last.includes(size)
        ? "ultimo"
        : two.includes(size)
          ? "quedan2"
          : "disponible",
  }));

const photo = (ref: string, width: number, height: number, alt: string) => ({
  src: `/placeholders/vizzano-${ref}.webp`,
  width,
  height,
  alt,
});

type SampleProduct = Omit<Product, "image">;

const sample: SampleProduct[] = [
  {
    id: "sandalia-nudo-dorada",
    ref: "6576.203",
    name: "Sandalia Nudo dorada",
    category: "Sandalias",
    price: 64900,
    tag: "nuevo",
    featured: true,
    variants: [
      {
        color: "Dorado",
        swatch: "#D8BE7A",
        image: photo("6576-203", 751, 476, "Sandalia dorada de taco bajo con tiras anudadas"),
        sizes: sizes({ out: [35], last: [40] }),
      },
    ],
  },
  {
    id: "zapato-pulsera",
    ref: "1475.202",
    name: "Zapato Pulsera",
    category: "Zapatos",
    price: 72900,
    featured: true,
    variants: [
      {
        color: "Plata",
        swatch: "#C9CCD1",
        image: photo("1475-202", 719, 497, "Zapato plateado en punta con taco cuadrado y pulsera"),
        sizes: sizes({ out: [40], two: [36] }),
      },
      {
        color: "Dorado",
        swatch: "#D8BE7A",
        image: photo("1475-202-b", 718, 497, "Zapato dorado en punta con taco cuadrado y pulsera"),
        sizes: sizes({ out: [35, 36], last: [39] }),
      },
    ],
  },
  {
    id: "stiletto-cobre",
    ref: "1456.200",
    name: "Stiletto bajo cobre",
    category: "Zapatos",
    price: 59900,
    compareAtPrice: 68900,
    tag: "oferta",
    variants: [
      {
        color: "Cobre",
        swatch: "#B87333",
        image: photo("1456-200", 750, 472, "Stiletto de taco bajo color cobre metalizado"),
        sizes: sizes({ out: [35, 39], last: [37] }),
      },
    ],
  },
  {
    id: "sandalia-tiras-plata",
    ref: "6291.1819",
    name: "Sandalia Tiras plata",
    category: "Sandalias",
    price: 66900,
    variants: [
      {
        color: "Plata",
        swatch: "#C9CCD1",
        image: photo("6291-1819", 757, 495, "Sandalia plateada de tiras con taco cuadrado"),
        sizes: sizes({ two: [38] }),
      },
    ],
  },
  {
    id: "sandalia-lazo",
    ref: "6464.152",
    name: "Sandalia Lazo",
    category: "Sandalias",
    price: 74900,
    tag: "ultimos",
    featured: true,
    variants: [
      {
        color: "Negro",
        swatch: "#1E1E1E",
        image: photo("6464-152", 504, 512, "Sandalia negra de taco cuadrado atada al tobillo"),
        sizes: sizes({ out: [36, 40], last: [37, 38] }),
      },
      {
        color: "Chocolate",
        swatch: "#6B4A32",
        image: photo("6464-152-b", 505, 513, "Sandalia color chocolate de taco cuadrado atada al tobillo"),
        sizes: sizes({ out: [35, 36, 40], last: [39] }),
      },
    ],
  },
  {
    id: "sandalia-tachas",
    ref: "6570.203",
    name: "Sandalia Tachas",
    category: "Sandalias",
    price: 59900,
    variants: [
      {
        color: "Camel",
        swatch: "#B9793F",
        image: photo("6570-203", 750, 381, "Sandalia baja color camel con tachas"),
        sizes: sizes({ out: [38] }),
      },
      {
        color: "Marrón",
        swatch: "#8A4B22",
        image: photo("6570-203-b", 750, 381, "Sandalia baja color marrón con tachas"),
        sizes: sizes({ out: [35], two: [37] }),
      },
    ],
  },
  {
    id: "sandalia-plana-dorada",
    ref: "6371.174",
    name: "Sandalia plana dorada",
    category: "Sandalias",
    price: 49900,
    variants: [
      {
        color: "Dorado",
        swatch: "#D8BE7A",
        image: photo("6371-174", 748, 374, "Sandalia plana dorada con tira al tobillo"),
        sizes: sizes(),
      },
    ],
  },
  {
    id: "chinela-dorada",
    ref: "6553.210",
    name: "Chinela dorada",
    category: "Sandalias",
    price: 44900,
    variants: [
      {
        color: "Dorado",
        swatch: "#D8BE7A",
        image: photo("6553-210", 750, 332, "Chinela plana dorada con anillo en el dedo"),
        sizes: sizes({ out: [35, 36] }),
      },
    ],
  },
  {
    id: "botineta-chocolate",
    ref: "3077.125",
    name: "Botineta chocolate",
    category: "Botas",
    price: 89900,
    tag: "nuevo",
    featured: true,
    variants: [
      {
        color: "Chocolate",
        swatch: "#5A3526",
        image: photo("3077-125", 618, 503, "Botineta baja color chocolate con cierre lateral"),
        sizes: sizes({ out: [37], two: [39] }),
      },
    ],
  },
  {
    id: "bota-larga",
    ref: "3105.103",
    name: "Bota larga",
    category: "Botas",
    price: 119900,
    variants: [
      {
        color: "Negro",
        swatch: "#1E1E1E",
        image: photo("3105-103", 222, 531, "Bota larga negra de taco alto"),
        sizes: sizes({ out: [35, 40] }),
      },
      {
        color: "Chocolate",
        swatch: "#5A3526",
        image: photo("3105-103-b", 222, 531, "Bota larga color chocolate de taco alto"),
        sizes: sizes({ out: [35, 39, 40], last: [36] }),
      },
    ],
  },
];

export const sampleProducts: Product[] = sample.map((product) => ({
  ...product,
  image: product.variants[0].image,
}));
