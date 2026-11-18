import { cacheLife, cacheTag } from "next/cache";
import { siteConfig } from "../../site.config";
import { CATALOG_TAG } from "./catalog";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Lo que devuelve `tienda_pagina_publica()` (supabase/tienda.sql). */
type PaginaRow = {
  anuncio: string | null;
  whatsapp: string | null;
  instagram: string | null;
  direccion: string | null;
  horario: string | null;
  mediosPago: string | null;
};

export type Pagina = {
  /** Cartel de arriba; null = no se muestra. */
  announcement: string | null;
  whatsapp: string;
  instagram: string;
  address: string;
  hours: string;
  /** Línea de medios de pago; vacío = no se muestra. */
  paymentNote: string;
};

const fallback = (row?: Partial<PaginaRow> | null): Pagina => ({
  announcement: row?.anuncio ?? null,
  whatsapp: row?.whatsapp || siteConfig.contact.whatsapp,
  instagram: row?.instagram || siteConfig.contact.instagram,
  address: row?.direccion || siteConfig.contact.address,
  hours: row?.horario || siteConfig.contact.hours,
  paymentNote: row?.mediosPago || siteConfig.catalog.paymentNote,
});

/**
 * Cartel y datos del local que se editan desde /admin → Página. Lo que no
 * cargaron sale de site.config.ts. Mismo caché que el catálogo: el editor lo
 * refresca al guardar. Si Supabase no responde (o todavía no se corrió el SQL
 * con los ajustes), la página sigue con lo de site.config: nunca se rompe por esto.
 */
export async function getPagina(): Promise<Pagina> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  if (!SUPABASE_URL || !SUPABASE_KEY) return fallback();
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/tienda_pagina_publica`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    if (!response.ok) {
      console.info(`[página] Sin ajustes de Supabase (HTTP ${response.status}): se usa site.config.`);
      return fallback();
    }
    return fallback((await response.json()) as PaginaRow | null);
  } catch (error) {
    console.info("[página] No se pudieron leer los ajustes: se usa site.config.", error);
    return fallback();
  }
}
