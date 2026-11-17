"use client";

import { PHOTO_BUCKET, supabaseBrowser } from "./supabase-browser";

/** Filas de las tablas tienda_ (supabase/tienda.sql) tal como las usa el editor. */
export type Talle = {
  id: string;
  color_id: string;
  talle_ar: number;
  talle_br: number | null;
  stock: number;
};

export type Color = {
  id: string;
  producto_id: string;
  nombre: string;
  muestra: string;
  codigo_color: string | null;
  foto_path: string | null;
  foto_ancho: number | null;
  foto_alto: number | null;
  orden: number;
  talles: Talle[];
};

export type Etiqueta = "nuevo" | "ultimos" | "oferta";

export type Producto = {
  id: string;
  slug: string;
  ref: string;
  nombre: string;
  categoria: string;
  precio: number;
  precio_anterior: number | null;
  etiqueta: Etiqueta | null;
  destacado: boolean;
  activo: boolean;
  orden: number;
  colores: Color[];
};

/** Lo que se encuentra al escanear un código ya cargado. */
export type CodigoEncontrado = {
  codigo: string;
  talle_id: string | null;
  color: Color & { producto: Omit<Producto, "colores"> };
};

export type Movimiento = {
  id: string;
  cantidad: number;
  motivo: "ingreso" | "venta" | "devolucion" | "ajuste";
  diferencia: boolean;
  nota: string | null;
  created_at: string;
  talle: {
    talle_ar: number;
    color: { nombre: string; producto: { nombre: string; ref: string } };
  } | null;
};

const db = () => supabaseBrowser();

/** Muestra el error de Supabase en castellano, sin detalles técnicos. */
function fail(error: { message: string; code?: string } | null, what: string): never {
  const msg = error?.message ?? "";
  if (error?.code === "23505") throw new Error(`${what}: ya existe.`);
  if (/row-level security|permission denied/i.test(msg)) {
    throw new Error(`${what}: tu cuenta no tiene permiso para editar la tienda.`);
  }
  if (/fetch|network/i.test(msg)) throw new Error(`${what}: no hay conexión. Probá de nuevo.`);
  throw new Error(`${what}: ${msg || "error desconocido"}.`);
}

const SELECT_PRODUCTO = "*, colores:tienda_colores(*, talles:tienda_talles(*))";

const sortProducto = (p: Producto): Producto => ({
  ...p,
  colores: [...p.colores]
    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre))
    .map((c) => ({ ...c, talles: [...c.talles].sort((a, b) => a.talle_ar - b.talle_ar) })),
});

export async function loadProductos(): Promise<Producto[]> {
  const { data, error } = await db().from("tienda_productos").select(SELECT_PRODUCTO).order("nombre");
  if (error) fail(error, "No se pudieron cargar los productos");
  return (data as Producto[]).map(sortProducto);
}

export async function loadProducto(id: string): Promise<Producto> {
  const { data, error } = await db().from("tienda_productos").select(SELECT_PRODUCTO).eq("id", id).single();
  if (error) fail(error, "No se pudo cargar el producto");
  return sortProducto(data as Producto);
}

export async function findCodigo(codigo: string): Promise<CodigoEncontrado | null> {
  const { data, error } = await db()
    .from("tienda_codigos")
    .select("codigo, talle_id, color:tienda_colores(*, talles:tienda_talles(*), producto:tienda_productos(*))")
    .eq("codigo", codigo)
    .maybeSingle();
  if (error) fail(error, "No se pudo buscar el código");
  return data as unknown as CodigoEncontrado | null;
}

/** Suma o resta pares (ingreso de mercadería o ajuste después de contar). */
export async function moverStock(
  talleId: string,
  cantidad: number,
  motivo: "ingreso" | "ajuste",
  extra: { codigo?: string; nota?: string } = {},
) {
  const { error } = await db()
    .from("tienda_movimientos")
    .insert({ talle_id: talleId, cantidad, motivo, codigo: extra.codigo ?? null, nota: extra.nota ?? null });
  if (error) fail(error, "No se pudo actualizar el stock");
}

/** El talle de ese color (lo crea si no existía). */
export async function asegurarTalle(colorId: string, talleAr: number, talleBr: number | null): Promise<Talle> {
  const { data: existing, error: findError } = await db()
    .from("tienda_talles")
    .select("*")
    .eq("color_id", colorId)
    .eq("talle_ar", talleAr)
    .maybeSingle();
  if (findError) fail(findError, "No se pudo buscar el talle");
  if (existing) return existing as Talle;
  const { data, error } = await db()
    .from("tienda_talles")
    .insert({ color_id: colorId, talle_ar: talleAr, talle_br: talleBr })
    .select("*")
    .single();
  if (error) fail(error, "No se pudo crear el talle");
  return data as Talle;
}

export async function guardarCodigo(codigo: string, colorId: string, talleId: string | null) {
  const { error } = await db().from("tienda_codigos").insert({ codigo, color_id: colorId, talle_id: talleId });
  if (error) fail(error, "No se pudo guardar el código");
}

export async function crearProducto(fields: {
  nombre: string;
  ref: string;
  categoria: string;
  precio: number;
}): Promise<Omit<Producto, "colores">> {
  const base = slugify(`${fields.nombre} ${fields.ref}`) || `modelo-${Date.now()}`;
  const { data, error } = await db()
    .from("tienda_productos")
    .insert({ ...fields, slug: base })
    .select("*")
    .single();
  if (error?.code === "23505") {
    // Mismo nombre y referencia que otro: se diferencia con un sufijo.
    const retry = await db()
      .from("tienda_productos")
      .insert({ ...fields, slug: `${base}-${Date.now().toString(36)}` })
      .select("*")
      .single();
    if (retry.error) fail(retry.error, "No se pudo crear el modelo");
    return retry.data as Omit<Producto, "colores">;
  }
  if (error) fail(error, "No se pudo crear el modelo");
  return data as Omit<Producto, "colores">;
}

export async function actualizarProducto(id: string, patch: Partial<Omit<Producto, "id" | "colores">>) {
  const { error } = await db().from("tienda_productos").update(patch).eq("id", id);
  if (error) fail(error, "No se pudo guardar el modelo");
}

export async function borrarProducto(id: string) {
  const { error } = await db().from("tienda_productos").delete().eq("id", id);
  if (error) fail(error, "No se pudo borrar el modelo");
}

export type FotoSubida = { path: string; width: number; height: number };

export async function subirFoto(productoSlug: string, colorNombre: string, photo: { blob: Blob; width: number; height: number; type: string }): Promise<FotoSubida> {
  const ext = photo.type === "image/webp" ? "webp" : photo.type === "image/jpeg" ? "jpg" : "png";
  const path = `${productoSlug}/${slugify(colorNombre) || "color"}-${Date.now().toString(36)}.${ext}`;
  const { error } = await db()
    .storage.from(PHOTO_BUCKET)
    .upload(path, photo.blob, { contentType: photo.type, cacheControl: "31536000", upsert: false });
  if (error) fail(error, "No se pudo subir la foto");
  return { path, width: photo.width, height: photo.height };
}

export async function crearColor(fields: {
  producto_id: string;
  nombre: string;
  muestra: string;
  codigo_color: string | null;
  foto?: FotoSubida;
  orden?: number;
}): Promise<Color> {
  const { foto, ...rest } = fields;
  const { data, error } = await db()
    .from("tienda_colores")
    .insert({
      ...rest,
      foto_path: foto?.path ?? null,
      foto_ancho: foto?.width ?? null,
      foto_alto: foto?.height ?? null,
    })
    .select("*")
    .single();
  if (error) fail(error, "No se pudo crear el color");
  return { ...(data as Omit<Color, "talles">), talles: [] };
}

export async function actualizarColor(
  id: string,
  patch: Partial<Pick<Color, "nombre" | "muestra" | "codigo_color">> & { foto?: FotoSubida },
) {
  const { foto, ...rest } = patch;
  const { error } = await db()
    .from("tienda_colores")
    .update({
      ...rest,
      ...(foto ? { foto_path: foto.path, foto_ancho: foto.width, foto_alto: foto.height } : {}),
    })
    .eq("id", id);
  if (error) fail(error, "No se pudo guardar el color");
}

export async function borrarColor(id: string) {
  const { error } = await db().from("tienda_colores").delete().eq("id", id);
  if (error) fail(error, "No se pudo borrar el color");
}

export async function loadMovimientos(limit = 80): Promise<Movimiento[]> {
  const { data, error } = await db()
    .from("tienda_movimientos")
    .select("id, cantidad, motivo, diferencia, nota, created_at, talle:tienda_talles(talle_ar, color:tienda_colores(nombre, producto:tienda_productos(nombre, ref)))")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail(error, "No se pudo cargar el historial");
  return data as unknown as Movimiento[];
}

/** "Sandalia Paris 6291.900" → "sandalia-paris-6291-900" (la dirección de la ficha). */
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export const totalStock = (p: Producto) =>
  p.colores.reduce((sum, c) => sum + c.talles.reduce((s, t) => s + t.stock, 0), 0);
