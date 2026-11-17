"use server";

import { updateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog";

/**
 * Después de guardar en el editor: refresca el catálogo de la página para que
 * el cambio se vea al instante (sin esperar el minuto de la caché).
 * Solo lo puede pedir un usuario de Cierre Caja: se verifica su sesión contra
 * Supabase antes de tocar nada.
 */
export async function refrescarCatalogo(accessToken: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !accessToken) return false;
  const headers = { apikey: key, Authorization: `Bearer ${accessToken}` };

  const user = await fetch(`${url}/auth/v1/user`, { headers, cache: "no-store" });
  if (!user.ok) return false;
  const { id } = (await user.json()) as { id?: string };
  if (!id) return false;

  const allowed = await fetch(`${url}/rest/v1/rpc/is_usuario_caja`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ uid: id }),
    cache: "no-store",
  });
  if (!allowed.ok || (await allowed.json()) !== true) return false;

  updateTag(CATALOG_TAG);
  return true;
}
