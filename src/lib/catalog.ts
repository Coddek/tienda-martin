import { cacheLife, cacheTag } from "next/cache";
import {
  sampleProducts,
  type Product,
  type ProductSize,
  type ProductTag,
  type StockLevel,
} from "@/data/products";

/** Etiqueta del caché: el editor la invalida al guardar para que el cambio se vea al toque. */
export const CATALOG_TAG = "catalogo";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const PHOTO_BUCKET = "tienda-fotos";

/** Lo que devuelve `tienda_catalogo_publico()` (supabase/tienda.sql). */
type CatalogRow = {
  id: string;
  ref: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  tag: ProductTag | null;
  featured: boolean;
  variants: {
    color: string;
    swatch: string;
    photoPath: string;
    photoWidth: number | null;
    photoHeight: number | null;
    photoAlt: string;
    sizes: { size: number; sizeBr: number | null; stock: StockLevel }[];
  }[];
};

const photoUrl = (path: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;

function toProduct(row: CatalogRow): Product {
  const variants = row.variants.map((variant) => ({
    color: variant.color,
    swatch: variant.swatch,
    image: {
      src: photoUrl(variant.photoPath),
      width: variant.photoWidth ?? 800,
      height: variant.photoHeight ?? 600,
      alt: variant.photoAlt,
    },
    sizes: variant.sizes satisfies ProductSize[],
  }));
  return {
    id: row.id,
    ref: row.ref,
    name: row.name,
    category: row.category,
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? undefined,
    tag: row.tag ?? undefined,
    featured: row.featured,
    image: variants[0].image,
    variants,
  };
}

/**
 * Catálogo de la página. Sale de Supabase cuando está configurado y tiene
 * productos con foto; si no, el catálogo de ejemplo. Queda en caché y se
 * refresca solo cada minuto (así las ventas del local llegan a la página sin
 * hacer nada) o al instante cuando el editor invalida CATALOG_TAG.
 * Si Supabase falla, se lanza el error: Next sigue mostrando la última versión
 * buena en lugar de cambiarla por el ejemplo.
 */
export async function getCatalog(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  // Estas líneas salen en el log del build de Vercel: sirven para confirmar
  // que las variables de Supabase están cargadas.
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.info("[catálogo] Supabase sin configurar: se muestra el catálogo de ejemplo.");
    return sampleProducts;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/tienda_catalogo_publico`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!response.ok) {
    throw new Error(`No se pudo leer el catálogo de Supabase (HTTP ${response.status}).`);
  }
  const rows = (await response.json()) as CatalogRow[];
  const products = rows.filter((row) => row.variants?.length).map(toProduct);
  console.info(
    products.length > 0
      ? `[catálogo] Supabase conectado: ${products.length} productos.`
      : "[catálogo] Supabase conectado, sin productos con foto: se muestra el catálogo de ejemplo.",
  );
  return products.length > 0 ? products : sampleProducts;
}

export async function getProduct(id: string) {
  const products = await getCatalog();
  return products.find((product) => product.id === id);
}

export const categoriesOf = (products: Product[]) =>
  Array.from(new Set(products.map((product) => product.category)));

export const sizesOf = (products: Product[]) =>
  Array.from(
    new Set(products.flatMap((p) => p.variants.flatMap((v) => v.sizes.map((s) => s.size)))),
  ).sort((a, b) => a - b);
