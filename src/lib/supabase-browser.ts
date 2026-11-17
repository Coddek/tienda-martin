"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Cliente de Supabase para el editor (/admin), que corre en el navegador. Usa
 * la clave pública: lo que cada persona puede hacer lo deciden las reglas de la
 * base (RLS), que solo dejan editar a los usuarios de Cierre Caja.
 */
export function supabaseBrowser(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  client = createClient(url, key, {
    // Sesión aparte de la de Cierre Caja (otro dominio): se guarda en este navegador.
    auth: { persistSession: true, storageKey: "tienda-martin-admin" },
  });
  return client;
}

export const PHOTO_BUCKET = "tienda-fotos";

export function photoPublicUrl(path: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${url}/storage/v1/object/public/${PHOTO_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
